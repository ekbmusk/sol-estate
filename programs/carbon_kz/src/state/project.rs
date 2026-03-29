use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum ProjectStatus {
    Active,
    Funded,
    Retired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum ProjectType {
    Solar,
    Wind,
    Forest,
    Industrial,
    Other,
}

#[account]
#[derive(InitSpace)]
pub struct CarbonProject {
    pub authority: Pubkey,
    #[max_len(32)]
    pub project_id: String,
    #[max_len(64)]
    pub name: String,
    pub project_type: ProjectType,
    pub carbon_mint: Pubkey,
    pub share_mint: Pubkey,
    pub total_credits: u64,
    pub credits_retired: u64,
    pub total_shares: u64,
    pub shares_sold: u64,
    pub price_per_share: u64,
    pub vault: Pubkey,
    pub total_dividends_per_share: u128,
    pub document_hash: [u8; 32],
    pub verified: bool,
    pub listing_count: u64,
    pub status: ProjectStatus,
    pub bump: u8,
}
