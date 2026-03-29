use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub seller: Pubkey,
    pub project: Pubkey,
    pub listing_id: u64,
    pub amount: u64,
    pub price_per_share: u64,
    pub active: bool,
    pub bump: u8,
}
