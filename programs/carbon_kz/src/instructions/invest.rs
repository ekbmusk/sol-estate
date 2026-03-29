use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};

use crate::errors::CarbonKZError;
use crate::events::SharesPurchased;
use crate::state::{CarbonProject, InvestorRecord, ProjectStatus, VaultAccount};

#[derive(Accounts)]
pub struct Invest<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
    )]
    pub project: Account<'info, CarbonProject>,

    #[account(
        mut,
        seeds = [b"vault", project.project_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        seeds = [b"share_mint", project.project_id.as_bytes()],
        bump,
    )]
    pub share_mint: Account<'info, Mint>,

    /// Investor's KZTE token account (source of payment)
    #[account(
        mut,
        constraint = investor_kzte_account.owner == investor.key(),
        constraint = investor_kzte_account.mint == vault.kzte_mint,
    )]
    pub investor_kzte_account: Box<Account<'info, TokenAccount>>,

    /// Vault's KZTE token account (destination for payment)
    #[account(
        mut,
        associated_token::mint = kzte_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Box<Account<'info, TokenAccount>>,

    /// Investor's share token account
    #[account(
        init_if_needed,
        payer = investor,
        associated_token::mint = share_mint,
        associated_token::authority = investor,
    )]
    pub investor_share_account: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = investor,
        space = 8 + InvestorRecord::INIT_SPACE,
        seeds = [b"investor", project.key().as_ref(), investor.key().as_ref()],
        bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    pub kzte_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handle_invest(ctx: Context<Invest>, amount: u64) -> Result<()> {
    let project = &ctx.accounts.project;

    require!(
        project.status == ProjectStatus::Active,
        CarbonKZError::ProjectNotActive
    );
    require!(project.verified, CarbonKZError::ProjectNotVerified);
    require!(amount > 0, CarbonKZError::AmountTooSmall);

    let available = project
        .total_shares
        .checked_sub(project.shares_sold)
        .ok_or(error!(CarbonKZError::Overflow))?;
    require!(amount <= available, CarbonKZError::InsufficientShares);

    // Calculate total cost: amount * price_per_share
    let total_cost = amount
        .checked_mul(project.price_per_share)
        .ok_or(error!(CarbonKZError::Overflow))?;

    // Transfer KZTE from investor to vault
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.investor_kzte_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.investor.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, total_cost)?;

    // Mint share tokens to investor
    let project_id = ctx.accounts.project.project_id.as_bytes();
    let project_bump = ctx.accounts.project.bump;
    let seeds: &[&[u8]] = &[b"project", project_id, &[project_bump]];
    let signer_seeds = &[seeds];

    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.share_mint.to_account_info(),
            to: ctx.accounts.investor_share_account.to_account_info(),
            authority: ctx.accounts.project.to_account_info(),
        },
        signer_seeds,
    );
    token::mint_to(mint_ctx, amount)?;

    // Capture keys before mutable borrows
    let investor_key = ctx.accounts.investor.key();
    let project_key = ctx.accounts.project.key();
    let project_id_str = ctx.accounts.project.project_id.clone();
    let investor_record_bump = ctx.bumps.investor_record;

    // Update project
    let project = &mut ctx.accounts.project;
    project.shares_sold = project
        .shares_sold
        .checked_add(amount)
        .ok_or(error!(CarbonKZError::Overflow))?;

    // Check if fully funded
    if project.shares_sold == project.total_shares {
        project.status = ProjectStatus::Funded;
    }

    let current_dividends_per_share = project.total_dividends_per_share;

    // Update vault
    let vault = &mut ctx.accounts.vault;
    vault.total_deposited = vault
        .total_deposited
        .checked_add(total_cost)
        .ok_or(error!(CarbonKZError::Overflow))?;

    // Update investor record
    let record = &mut ctx.accounts.investor_record;
    if !record.is_initialized {
        record.owner = investor_key;
        record.project = project_key;
        record.shares_owned = 0;
        record.kzte_invested = 0;
        record.last_claimed = current_dividends_per_share;
        record.is_initialized = true;
        record.bump = investor_record_bump;
    }
    record.shares_owned = record
        .shares_owned
        .checked_add(amount)
        .ok_or(error!(CarbonKZError::Overflow))?;
    record.kzte_invested = record
        .kzte_invested
        .checked_add(total_cost)
        .ok_or(error!(CarbonKZError::Overflow))?;

    emit!(SharesPurchased {
        project_id: project_id_str,
        investor: investor_key,
        amount,
        total_cost,
    });

    msg!("Invested {} shares for {} KZTE", amount, total_cost);
    Ok(())
}
