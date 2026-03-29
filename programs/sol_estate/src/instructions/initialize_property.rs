use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::state::{PropertyAccount, PropertyStatus, VaultAccount};

#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct InitializeProperty<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + PropertyAccount::INIT_SPACE,
        seeds = [b"property", property_id.as_bytes()],
        bump,
    )]
    pub property: Account<'info, PropertyAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + VaultAccount::INIT_SPACE,
        seeds = [b"vault", property_id.as_bytes()],
        bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = property,
        seeds = [b"share_mint", property_id.as_bytes()],
        bump,
    )]
    pub share_mint: Account<'info, Mint>,

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
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_initialize_property(
    ctx: Context<InitializeProperty>,
    property_id: String,
    name: String,
    total_shares: u64,
    price_per_share: u64,
    document_hash: [u8; 32],
) -> Result<()> {
    let property = &mut ctx.accounts.property;
    property.authority = ctx.accounts.authority.key();
    property.property_id = property_id;
    property.name = name;
    property.total_shares = total_shares;
    property.shares_sold = 0;
    property.price_per_share = price_per_share;
    property.share_mint = ctx.accounts.share_mint.key();
    property.vault = ctx.accounts.vault.key();
    property.total_dividends_per_share = 0;
    property.document_hash = document_hash;
    property.status = PropertyStatus::Active;
    property.bump = ctx.bumps.property;

    let vault = &mut ctx.accounts.vault;
    vault.property = ctx.accounts.property.key();
    vault.kzte_mint = ctx.accounts.kzte_mint.key();
    vault.total_deposited = 0;
    vault.total_claimed = 0;
    vault.bump = ctx.bumps.vault;

    msg!("Property initialized: {}", ctx.accounts.property.key());
    Ok(())
}
