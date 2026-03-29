use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::SolEstateError;
use crate::state::{InvestorRecord, Listing, PropertyAccount};

#[derive(Accounts)]
pub struct ListShares<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        seeds = [b"property", property.property_id.as_bytes()],
        bump = property.bump,
    )]
    pub property: Account<'info, PropertyAccount>,

    #[account(
        mut,
        seeds = [b"investor", property.key().as_ref(), seller.key().as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    #[account(
        init,
        payer = seller,
        space = 8 + Listing::INIT_SPACE,
        seeds = [b"listing", property.key().as_ref(), seller.key().as_ref()],
        bump,
    )]
    pub listing: Account<'info, Listing>,

    /// Seller's share token account
    #[account(
        mut,
        constraint = seller_share_account.owner == seller.key(),
        constraint = seller_share_account.mint == property.share_mint,
    )]
    pub seller_share_account: Account<'info, TokenAccount>,

    /// Escrow token account for shares, owned by the listing PDA
    #[account(
        mut,
        constraint = escrow_share_account.mint == property.share_mint,
    )]
    pub escrow_share_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_list_shares(ctx: Context<ListShares>, amount: u64, price_per_share: u64) -> Result<()> {
    let record = &ctx.accounts.investor_record;
    require!(
        record.shares_owned >= amount,
        SolEstateError::InsufficientShares
    );
    require!(amount > 0, SolEstateError::AmountTooSmall);

    // Transfer shares from seller to escrow
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.seller_share_account.to_account_info(),
            to: ctx.accounts.escrow_share_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Create listing
    let listing = &mut ctx.accounts.listing;
    listing.seller = ctx.accounts.seller.key();
    listing.property = ctx.accounts.property.key();
    listing.amount = amount;
    listing.price_per_share = price_per_share;
    listing.active = true;
    listing.bump = ctx.bumps.listing;

    msg!(
        "Listed {} shares at {} KZTE per share",
        amount,
        price_per_share
    );
    Ok(())
}
