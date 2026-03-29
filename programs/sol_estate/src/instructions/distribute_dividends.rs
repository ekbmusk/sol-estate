use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::SolEstateError;
use crate::events::DividendsDistributed;
use crate::state::{PropertyAccount, VaultAccount};

#[derive(Accounts)]
pub struct DistributeDividends<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"property", property.property_id.as_bytes()],
        bump = property.bump,
        has_one = authority,
    )]
    pub property: Account<'info, PropertyAccount>,

    #[account(
        mut,
        seeds = [b"vault", property.property_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    /// Authority's KZTE token account (source of dividends)
    #[account(
        mut,
        constraint = authority_kzte_account.owner == authority.key(),
        constraint = authority_kzte_account.mint == vault.kzte_mint,
    )]
    pub authority_kzte_account: Account<'info, TokenAccount>,

    /// Vault's KZTE token account (destination for dividends)
    #[account(
        mut,
        constraint = vault_token_account.mint == vault.kzte_mint,
        constraint = vault_token_account.owner == vault.key(),
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_distribute_dividends(ctx: Context<DistributeDividends>, amount: u64) -> Result<()> {
    let property = &ctx.accounts.property;

    require!(property.shares_sold > 0, SolEstateError::AmountTooSmall);

    // Transfer KZTE from authority to vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.authority_kzte_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Update dividends per share: amount / shares_sold
    let dividend_per_share = amount
        .checked_div(property.shares_sold)
        .ok_or(error!(SolEstateError::Overflow))?;

    let property_id_str = property.property_id.clone();
    let property = &mut ctx.accounts.property;
    property.total_dividends_per_share = property
        .total_dividends_per_share
        .checked_add(dividend_per_share)
        .ok_or(error!(SolEstateError::Overflow))?;

    emit!(DividendsDistributed {
        property_id: property_id_str,
        amount,
        dividend_per_share,
    });

    msg!(
        "Distributed {} KZTE as dividends ({} per share)",
        amount,
        dividend_per_share
    );
    Ok(())
}
