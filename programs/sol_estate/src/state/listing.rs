use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub seller: Pubkey,
    pub property: Pubkey,
    pub amount: u64,
    pub price_per_share: u64,
    pub active: bool,
    pub bump: u8,
}
