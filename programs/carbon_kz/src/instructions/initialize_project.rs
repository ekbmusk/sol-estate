use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::events::ProjectInitialized;
use crate::state::{CarbonProject, ProjectStatus, ProjectType, VaultAccount};

#[derive(Accounts)]
#[instruction(project_id: String)]
pub struct InitializeProject<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + CarbonProject::INIT_SPACE,
        seeds = [b"project", project_id.as_bytes()],
        bump,
    )]
    pub project: Account<'info, CarbonProject>,

    #[account(
        init,
        payer = authority,
        space = 8 + VaultAccount::INIT_SPACE,
        seeds = [b"vault", project_id.as_bytes()],
        bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = project,
        seeds = [b"share_mint", project_id.as_bytes()],
        bump,
    )]
    pub share_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = project,
        seeds = [b"carbon_mint", project_id.as_bytes()],
        bump,
    )]
    pub carbon_mint: Account<'info, Mint>,

    /// The KZTE token mint
    pub kzte_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = kzte_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handle_initialize_project(
    ctx: Context<InitializeProject>,
    project_id: String,
    name: String,
    project_type: ProjectType,
    total_credits: u64,
    total_shares: u64,
    price_per_share: u64,
    document_hash: [u8; 32],
) -> Result<()> {
    let project = &mut ctx.accounts.project;
    project.authority = ctx.accounts.authority.key();
    project.project_id = project_id;
    project.name = name;
    project.project_type = project_type;
    project.carbon_mint = ctx.accounts.carbon_mint.key();
    project.share_mint = ctx.accounts.share_mint.key();
    project.total_credits = total_credits;
    project.credits_retired = 0;
    project.total_shares = total_shares;
    project.shares_sold = 0;
    project.price_per_share = price_per_share;
    project.vault = ctx.accounts.vault.key();
    project.total_dividends_per_share = 0;
    project.document_hash = document_hash;
    project.verified = false;
    project.listing_count = 0;
    project.status = ProjectStatus::Active;
    project.bump = ctx.bumps.project;

    let vault = &mut ctx.accounts.vault;
    vault.project = ctx.accounts.project.key();
    vault.kzte_mint = ctx.accounts.kzte_mint.key();
    vault.total_deposited = 0;
    vault.total_claimed = 0;
    vault.bump = ctx.bumps.vault;

    let type_str = match ctx.accounts.project.project_type {
        ProjectType::Solar => "Solar",
        ProjectType::Wind => "Wind",
        ProjectType::Forest => "Forest",
        ProjectType::Industrial => "Industrial",
        ProjectType::Other => "Other",
    };

    emit!(ProjectInitialized {
        project_id: ctx.accounts.project.project_id.clone(),
        authority: ctx.accounts.authority.key(),
        project_type: type_str.to_string(),
        total_credits,
        total_shares,
        price_per_share,
    });

    msg!("Project initialized: {}", ctx.accounts.project.key());
    Ok(())
}
