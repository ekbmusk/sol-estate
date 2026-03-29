use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum PropertyStatus {
    Active,
    Funded,
    Closed,
}

#[account]
#[derive(InitSpace)]
pub struct PropertyAccount {
    pub authority: Pubkey,
    #[max_len(32)]
    pub property_id: String,
    #[max_len(64)]
    pub name: String,
    pub total_shares: u64,
    pub shares_sold: u64,
    pub price_per_share: u64,
    pub share_mint: Pubkey,
    pub vault: Pubkey,
    pub total_dividends_per_share: u64,
    pub document_hash: [u8; 32],
    pub status: PropertyStatus,
    pub bump: u8,
}
