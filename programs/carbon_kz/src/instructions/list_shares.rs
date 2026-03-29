use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::CarbonKZError;
use crate::events::SharesListed;
use crate::state::{CarbonProject, InvestorRecord, Listing};

#[derive(Accounts)]
pub struct ListShares<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
    )]
    pub project: Account<'info, CarbonProject>,

    #[account(
        mut,
        seeds = [b"investor", project.key().as_ref(), seller.key().as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    #[account(
        init,
        payer = seller,
        space = 8 + Listing::INIT_SPACE,
        seeds = [b"listing", project.key().as_ref(), seller.key().as_ref(), &project.listing_count.to_le_bytes()],
        bump,
    )]
    pub listing: Account<'info, Listing>,

    /// Seller's share token account
    #[account(
        mut,
        constraint = seller_share_account.owner == seller.key(),
        constraint = seller_share_account.mint == project.share_mint,
    )]
    pub seller_share_account: Account<'info, TokenAccount>,

    /// Escrow token account for shares, owned by the listing PDA
    #[account(
        mut,
        constraint = escrow_share_account.mint == project.share_mint,
        constraint = escrow_share_account.owner == listing.key(),
    )]
    pub escrow_share_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handle_list_shares(ctx: Context<ListShares>, amount: u64, price_per_share: u64) -> Result<()> {
    let record = &ctx.accounts.investor_record;
    require!(
        record.shares_owned >= amount,
        CarbonKZError::InsufficientShares
    );
    require!(amount > 0, CarbonKZError::AmountTooSmall);

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

    // Decrement seller's shares_owned to reflect escrowed shares
    let record = &mut ctx.accounts.investor_record;
    record.shares_owned = record
        .shares_owned
        .checked_sub(amount)
        .ok_or(error!(CarbonKZError::Overflow))?;

    // Create listing
    let listing_id = ctx.accounts.project.listing_count;
    let listing = &mut ctx.accounts.listing;
    listing.seller = ctx.accounts.seller.key();
    listing.project = ctx.accounts.project.key();
    listing.listing_id = listing_id;
    listing.amount = amount;
    listing.price_per_share = price_per_share;
    listing.active = true;
    listing.bump = ctx.bumps.listing;

    // Increment listing counter
    let project = &mut ctx.accounts.project;
    project.listing_count = project
        .listing_count
        .checked_add(1)
        .ok_or(error!(CarbonKZError::Overflow))?;

    emit!(SharesListed {
        project_id: ctx.accounts.project.project_id.clone(),
        seller: ctx.accounts.seller.key(),
        amount,
        price_per_share,
    });

    msg!(
        "Listed {} shares at {} KZTE per share",
        amount,
        price_per_share
    );
    Ok(())
}
