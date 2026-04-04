use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::CarbonKZError;
use crate::events::DividendsClaimed;
use crate::state::{CarbonProject, InvestorRecord, VaultAccount};

#[derive(Accounts)]
pub struct ClaimDividends<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
    )]
    pub project: Account<'info, CarbonProject>,

    #[account(
        seeds = [b"vault", project.project_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        seeds = [b"investor", project.key().as_ref(), investor.key().as_ref()],
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
    let project = &ctx.accounts.project;
    let record = &ctx.accounts.investor_record;

    // u128 arithmetic with PRECISION scaling (must match distribute_revenue)
    const PRECISION: u128 = 1_000_000_000_000;

    let unclaimed_per_share = project
        .total_dividends_per_share
        .checked_sub(record.last_claimed)
        .ok_or(error!(CarbonKZError::Overflow))?;

    // Multiply before divide — u128 has enough headroom (max ~3.4×10^38)
    // unclaimed_per_share ≤ ~10^30, shares_owned ≤ ~10^9 → product ≤ ~10^39, safe for u128
    let claimable = unclaimed_per_share
        .checked_mul(record.shares_owned as u128)
        .ok_or(error!(CarbonKZError::Overflow))?
        .checked_div(PRECISION)
        .ok_or(error!(CarbonKZError::Overflow))? as u64;

    require!(claimable > 0, CarbonKZError::NothingToClaim);

    let project_id_str = project.project_id.clone();
    let investor_key = ctx.accounts.investor.key();

    // Transfer KZTE from vault to investor using vault PDA as signer
    let project_id = project.project_id.as_bytes();
    let vault_bump = ctx.accounts.vault.bump;
    let seeds: &[&[u8]] = &[b"vault", project_id, &[vault_bump]];
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
    record.last_claimed = project.total_dividends_per_share;

    emit!(DividendsClaimed {
        project_id: project_id_str,
        investor: investor_key,
        amount: claimable,
    });

    msg!("Claimed {} KZTE in dividends", claimable);
    Ok(())
}
