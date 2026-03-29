use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token, TokenAccount, Transfer},
};

use crate::errors::SolEstateError;
use crate::state::{InvestorRecord, Listing, PropertyAccount};

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: seller wallet, validated via listing
    #[account(mut)]
    pub seller: AccountInfo<'info>,

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
        constraint = listing.seller == seller.key(),
    )]
    pub listing: Account<'info, Listing>,

    /// Buyer's KZTE token account (payment source)
    #[account(
        mut,
        constraint = buyer_kzte_account.owner == buyer.key(),
    )]
    pub buyer_kzte_account: Account<'info, TokenAccount>,

    /// Seller's KZTE token account (payment destination)
    #[account(
        mut,
        constraint = seller_kzte_account.owner == seller.key(),
    )]
    pub seller_kzte_account: Account<'info, TokenAccount>,

    /// Escrow share token account
    #[account(
        mut,
        constraint = escrow_share_account.mint == property.share_mint,
    )]
    pub escrow_share_account: Account<'info, TokenAccount>,

    /// Buyer's share token account
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = share_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_share_account: Account<'info, TokenAccount>,

    /// The share mint
    #[account(
        constraint = share_mint.key() == property.share_mint,
    )]
    pub share_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + InvestorRecord::INIT_SPACE,
        seeds = [b"investor", property.key().as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub buyer_record: Account<'info, InvestorRecord>,

    #[account(
        mut,
        seeds = [b"investor", property.key().as_ref(), seller.key().as_ref()],
        bump = seller_record.bump,
    )]
    pub seller_record: Account<'info, InvestorRecord>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_buy_shares(ctx: Context<BuyShares>) -> Result<()> {
    let listing = &ctx.accounts.listing;
    let amount = listing.amount;
    let price_per_share = listing.price_per_share;

    let total_cost = amount
        .checked_mul(price_per_share)
        .ok_or(error!(SolEstateError::Overflow))?;

    // Transfer KZTE from buyer to seller
    let kzte_transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.buyer_kzte_account.to_account_info(),
            to: ctx.accounts.seller_kzte_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::transfer(kzte_transfer_ctx, total_cost)?;

    // Transfer shares from escrow to buyer using listing PDA as signer
    let property_key = ctx.accounts.property.key();
    let seller_key = ctx.accounts.seller.key();
    let listing_bump = ctx.accounts.listing.bump;
    let seeds: &[&[u8]] = &[
        b"listing",
        property_key.as_ref(),
        seller_key.as_ref(),
        &[listing_bump],
    ];
    let signer_seeds = &[seeds];

    let share_transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_share_account.to_account_info(),
            to: ctx.accounts.buyer_share_account.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(share_transfer_ctx, amount)?;

    // Update seller record
    let seller_record = &mut ctx.accounts.seller_record;
    seller_record.shares_owned = seller_record
        .shares_owned
        .checked_sub(amount)
        .ok_or(error!(SolEstateError::Overflow))?;

    // Update buyer record
    let buyer_record = &mut ctx.accounts.buyer_record;
    if buyer_record.owner == Pubkey::default() {
        buyer_record.owner = ctx.accounts.buyer.key();
        buyer_record.property = ctx.accounts.property.key();
        buyer_record.shares_owned = 0;
        buyer_record.kzte_invested = 0;
        buyer_record.last_claimed = ctx.accounts.property.total_dividends_per_share;
        buyer_record.bump = ctx.bumps.buyer_record;
    }
    buyer_record.shares_owned = buyer_record
        .shares_owned
        .checked_add(amount)
        .ok_or(error!(SolEstateError::Overflow))?;

    // Deactivate listing
    let listing = &mut ctx.accounts.listing;
    listing.active = false;

    msg!(
        "Bought {} shares for {} KZTE",
        amount,
        total_cost
    );
    Ok(())
}
