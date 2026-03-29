use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::SolEstateError;
use crate::events::DividendsClaimed;
use crate::state::{InvestorRecord, PropertyAccount, VaultAccount};

#[derive(Accounts)]
pub struct ClaimDividends<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        seeds = [b"property", property.property_id.as_bytes()],
        bump = property.bump,
    )]
    pub property: Account<'info, PropertyAccount>,

    #[account(
        seeds = [b"vault", property.property_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        seeds = [b"investor", property.key().as_ref(), investor.key().as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    /// Vault's KZTE token account (source)
    #[account(
        mut,
        constraint = vault_token_account.mint == vault.kzte_mint,
        constraint = vault_token_account.owner == vault.key(),
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Investor's KZTE token account (destination)
    #[account(
        mut,
        constraint = investor_kzte_account.owner == investor.key(),
        constraint = investor_kzte_account.mint == vault.kzte_mint,
    )]
    pub investor_kzte_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_claim_dividends(ctx: Context<ClaimDividends>) -> Result<()> {
    let property = &ctx.accounts.property;
    let record = &ctx.accounts.investor_record;

    let unclaimed_per_share = property
        .total_dividends_per_share
        .checked_sub(record.last_claimed)
        .ok_or(error!(SolEstateError::Overflow))?;

    let claimable = unclaimed_per_share
        .checked_mul(record.shares_owned)
        .ok_or(error!(SolEstateError::Overflow))?;

    require!(claimable > 0, SolEstateError::NothingToClaim);

    let property_id_str = property.property_id.clone();
    let investor_key = ctx.accounts.investor.key();

    // Transfer KZTE from vault to investor using vault PDA as signer
    let property_id = property.property_id.as_bytes();
    let vault_bump = ctx.accounts.vault.bump;
    let seeds: &[&[u8]] = &[b"vault", property_id, &[vault_bump]];
    let signer_seeds = &[seeds];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.investor_kzte_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, claimable)?;

    // Update investor record
    let record = &mut ctx.accounts.investor_record;
    record.last_claimed = property.total_dividends_per_share;

    emit!(DividendsClaimed {
        property_id: property_id_str,
        investor: investor_key,
        amount: claimable,
    });

    msg!("Claimed {} KZTE in dividends", claimable);
    Ok(())
}
