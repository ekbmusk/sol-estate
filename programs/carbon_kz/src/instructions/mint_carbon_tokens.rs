use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

use crate::errors::CarbonKZError;
use crate::state::CarbonProject;

#[derive(Accounts)]
pub struct MintCarbonTokens<'info> {
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
        seeds = [b"carbon_mint", project.project_id.as_bytes()],
        bump,
        constraint = carbon_mint.key() == project.carbon_mint,
    )]
    pub carbon_mint: Account<'info, Mint>,

    /// Recipient's carbon token account
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = carbon_mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: any valid recipient
    pub recipient: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handle_mint_carbon_tokens(
    ctx: Context<MintCarbonTokens>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, CarbonKZError::AmountTooSmall);

    // Cap at total_credits
    let current_supply = ctx.accounts.carbon_mint.supply;
    let max_mintable = ctx.accounts.project.total_credits
        .checked_sub(current_supply)
        .ok_or(error!(CarbonKZError::Overflow))?;
    require!(amount <= max_mintable, CarbonKZError::InsufficientCredits);

    // Mint using project PDA as signer
    let project_id = ctx.accounts.project.project_id.as_bytes();
    let project_bump = ctx.accounts.project.bump;
    let seeds: &[&[u8]] = &[b"project", project_id, &[project_bump]];
    let signer_seeds = &[seeds];

    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.carbon_mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.project.to_account_info(),
        },
        signer_seeds,
    );
    token::mint_to(mint_ctx, amount)?;

    msg!(
        "Minted {} carbon tokens for project {}",
        amount,
        ctx.accounts.project.project_id
    );
    Ok(())
}
