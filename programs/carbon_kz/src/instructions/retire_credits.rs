use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};

use crate::errors::CarbonKZError;
use crate::events::CreditsRetired;
use crate::state::{CarbonProject, RetireRecord};

#[derive(Accounts)]
#[instruction(retire_id: [u8; 16])]
pub struct RetireCredits<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
    )]
    pub project: Account<'info, CarbonProject>,

    #[account(
        mut,
        seeds = [b"carbon_mint", project.project_id.as_bytes()],
        bump,
        constraint = carbon_mint.key() == project.carbon_mint,
    )]
    pub carbon_mint: Account<'info, Mint>,

    /// Buyer's carbon token account (source of tokens to burn)
    #[account(
        mut,
        constraint = buyer_carbon_account.owner == buyer.key(),
        constraint = buyer_carbon_account.mint == carbon_mint.key(),
    )]
    pub buyer_carbon_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = buyer,
        space = 8 + RetireRecord::INIT_SPACE,
        seeds = [b"retire", project.key().as_ref(), buyer.key().as_ref(), &retire_id],
        bump,
    )]
    pub retire_record: Account<'info, RetireRecord>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_retire_credits(
    ctx: Context<RetireCredits>,
    _retire_id: [u8; 16],
    amount: u64,
    purpose: String,
) -> Result<()> {
    require!(amount > 0, CarbonKZError::AmountTooSmall);
    require!(
        ctx.accounts.buyer_carbon_account.amount >= amount,
        CarbonKZError::InsufficientCredits
    );

    // BURN FIRST — security: burn before state mutation
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.carbon_mint.to_account_info(),
            from: ctx.accounts.buyer_carbon_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::burn(burn_ctx, amount)?;

    // Update project state
    let project = &mut ctx.accounts.project;
    project.credits_retired = project
        .credits_retired
        .checked_add(amount)
        .ok_or(error!(CarbonKZError::Overflow))?;

    let project_id_str = project.project_id.clone();

    // Create retire record
    let record = &mut ctx.accounts.retire_record;
    record.buyer = ctx.accounts.buyer.key();
    record.project = ctx.accounts.project.key();
    record.amount_retired = amount;
    record.timestamp = Clock::get()?.unix_timestamp;
    record.purpose = purpose.clone();
    record.bump = ctx.bumps.retire_record;

    emit!(CreditsRetired {
        project_id: project_id_str,
        buyer: ctx.accounts.buyer.key(),
        amount,
        purpose,
    });

    msg!("Retired {} carbon credits", amount);
    Ok(())
}
