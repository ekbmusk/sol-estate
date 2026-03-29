use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::CarbonKZError;
use crate::events::RevenueDistributed;
use crate::state::{CarbonProject, VaultAccount};

#[derive(Accounts)]
pub struct DistributeRevenue<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
        has_one = authority,
    )]
    pub project: Account<'info, CarbonProject>,

    #[account(
        mut,
        seeds = [b"vault", project.project_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    /// Authority's KZTE token account (source of revenue)
    #[account(
        mut,
        constraint = authority_kzte_account.owner == authority.key(),
        constraint = authority_kzte_account.mint == vault.kzte_mint,
    )]
    pub authority_kzte_account: Account<'info, TokenAccount>,

    /// Vault's KZTE token account (destination for revenue)
    #[account(
        mut,
        constraint = vault_token_account.mint == vault.kzte_mint,
        constraint = vault_token_account.owner == vault.key(),
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_distribute_revenue(ctx: Context<DistributeRevenue>, amount: u64) -> Result<()> {
    let project = &ctx.accounts.project;

    require!(project.shares_sold > 0, CarbonKZError::AmountTooSmall);

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

    // Update dividends per share with scaling factor for precision
    // PRECISION = 10^12 prevents rounding loss on small distributions
    const PRECISION: u128 = 1_000_000_000_000;
    let dividend_per_share = (amount as u128)
        .checked_mul(PRECISION)
        .ok_or(error!(CarbonKZError::Overflow))?
        .checked_div(project.shares_sold as u128)
        .ok_or(error!(CarbonKZError::Overflow))?;

    let project_id_str = project.project_id.clone();
    let project = &mut ctx.accounts.project;
    project.total_dividends_per_share = project
        .total_dividends_per_share
        .checked_add(dividend_per_share)
        .ok_or(error!(CarbonKZError::Overflow))?;

    emit!(RevenueDistributed {
        project_id: project_id_str,
        amount,
        dividend_per_share: dividend_per_share as u64,
    });

    msg!(
        "Distributed {} KZTE as revenue ({} per share)",
        amount,
        dividend_per_share
    );
    Ok(())
}
