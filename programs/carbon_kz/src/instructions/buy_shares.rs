use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token, TokenAccount, Transfer},
};

use crate::errors::CarbonKZError;
use crate::events::SharesBought;
use crate::state::{CarbonProject, InvestorRecord, Listing, VaultAccount};

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: seller wallet, validated via listing
    #[account(mut)]
    pub seller: AccountInfo<'info>,

    #[account(
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
    )]
    pub project: Box<Account<'info, CarbonProject>>,

    #[account(
        seeds = [b"vault", project.project_id.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Box<Account<'info, VaultAccount>>,

    #[account(
        mut,
        seeds = [b"listing", project.key().as_ref(), seller.key().as_ref(), &listing.listing_id.to_le_bytes()],
        bump = listing.bump,
        constraint = listing.active @ CarbonKZError::ListingNotFound,
        constraint = listing.seller == seller.key(),
        close = buyer,
    )]
    pub listing: Box<Account<'info, Listing>>,

    /// Buyer's KZTE token account (payment source)
    #[account(
        mut,
        constraint = buyer_kzte_account.owner == buyer.key(),
        constraint = buyer_kzte_account.mint == vault.kzte_mint,
    )]
    pub buyer_kzte_account: Box<Account<'info, TokenAccount>>,

    /// Seller's KZTE token account (payment destination)
    #[account(
        mut,
        constraint = seller_kzte_account.owner == seller.key(),
        constraint = seller_kzte_account.mint == vault.kzte_mint,
    )]
    pub seller_kzte_account: Box<Account<'info, TokenAccount>>,

    /// Escrow share token account — must be owned by listing PDA
    #[account(
        mut,
        constraint = escrow_share_account.mint == project.share_mint,
        constraint = escrow_share_account.owner == listing.key() @ CarbonKZError::Unauthorized,
    )]
    pub escrow_share_account: Box<Account<'info, TokenAccount>>,

    /// Buyer's share token account
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = share_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_share_account: Box<Account<'info, TokenAccount>>,

    /// The share mint
    #[account(
        constraint = share_mint.key() == project.share_mint,
    )]
    pub share_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + InvestorRecord::INIT_SPACE,
        seeds = [b"investor", project.key().as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub buyer_record: Account<'info, InvestorRecord>,

    #[account(
        seeds = [b"investor", project.key().as_ref(), seller.key().as_ref()],
        bump = seller_record.bump,
    )]
    pub seller_record: Account<'info, InvestorRecord>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handle_buy_shares(ctx: Context<BuyShares>) -> Result<()> {
    let listing = &ctx.accounts.listing;
    let amount = listing.amount;
    let price_per_share = listing.price_per_share;

    let total_cost = amount
        .checked_mul(price_per_share)
        .ok_or(error!(CarbonKZError::Overflow))?;

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
    let project_key = ctx.accounts.project.key();
    let seller_key = ctx.accounts.seller.key();
    let listing_id_bytes = ctx.accounts.listing.listing_id.to_le_bytes();
    let listing_bump = ctx.accounts.listing.bump;
    let seeds: &[&[u8]] = &[
        b"listing",
        project_key.as_ref(),
        seller_key.as_ref(),
        &listing_id_bytes,
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

    // Update buyer record
    let buyer_record = &mut ctx.accounts.buyer_record;
    if !buyer_record.is_initialized {
        buyer_record.owner = ctx.accounts.buyer.key();
        buyer_record.project = ctx.accounts.project.key();
        buyer_record.shares_owned = 0;
        buyer_record.kzte_invested = 0;
        buyer_record.last_claimed = ctx.accounts.project.total_dividends_per_share;
        buyer_record.is_initialized = true;
        buyer_record.bump = ctx.bumps.buyer_record;
    }
    buyer_record.shares_owned = buyer_record
        .shares_owned
        .checked_add(amount)
        .ok_or(error!(CarbonKZError::Overflow))?;

    // Listing account is closed via close = buyer constraint

    emit!(SharesBought {
        project_id: ctx.accounts.project.project_id.clone(),
        buyer: ctx.accounts.buyer.key(),
        seller: ctx.accounts.seller.key(),
        amount,
        total_cost,
    });

    msg!(
        "Bought {} shares for {} KZTE",
        amount,
        total_cost
    );
    Ok(())
}
