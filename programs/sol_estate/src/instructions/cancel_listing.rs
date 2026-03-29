use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::SolEstateError;
use crate::events::ListingCancelled;
use crate::state::{InvestorRecord, Listing, PropertyAccount};

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        seeds = [b"property", property.property_id.as_bytes()],
        bump = property.bump,
    )]
    pub property: Account<'info, PropertyAccount>,

    #[account(
        mut,
        seeds = [b"listing", property.key().as_ref(), seller.key().as_ref()],
        bump = listing.bump,
        constraint = listing.active @ SolEstateError::ListingNotFound,
        constraint = listing.seller == seller.key() @ SolEstateError::Unauthorized,
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        mut,
        seeds = [b"investor", property.key().as_ref(), seller.key().as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    /// Escrow share account (return shares to seller)
    #[account(
        mut,
        constraint = escrow_share_account.mint == property.share_mint,
        constraint = escrow_share_account.owner == listing.key(),
    )]
    pub escrow_share_account: Account<'info, TokenAccount>,

    /// Seller's share token account (destination)
    #[account(
        mut,
        constraint = seller_share_account.owner == seller.key(),
        constraint = seller_share_account.mint == property.share_mint,
    )]
    pub seller_share_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
    let listing = &ctx.accounts.listing;
    let amount = listing.amount;

    // Transfer shares from escrow back to seller using listing PDA as signer
    let property_key = ctx.accounts.property.key();
    let seller_key = ctx.accounts.seller.key();
    let listing_bump = listing.bump;
    let seeds: &[&[u8]] = &[
        b"listing",
        property_key.as_ref(),
        seller_key.as_ref(),
        &[listing_bump],
    ];
    let signer_seeds = &[seeds];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_share_account.to_account_info(),
            to: ctx.accounts.seller_share_account.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    // Re-increment seller's shares_owned
    let record = &mut ctx.accounts.investor_record;
    record.shares_owned = record
        .shares_owned
        .checked_add(amount)
        .ok_or(error!(SolEstateError::Overflow))?;

    // Deactivate listing
    let listing = &mut ctx.accounts.listing;
    listing.active = false;

    emit!(ListingCancelled {
        property_id: ctx.accounts.property.property_id.clone(),
        seller: ctx.accounts.seller.key(),
        amount,
    });

    msg!("Cancelled listing of {} shares", amount);
    Ok(())
}
