use anchor_lang::prelude::*;

#[event]
pub struct ProjectInitialized {
    pub project_id: String,
    pub authority: Pubkey,
    pub project_type: String,
    pub total_credits: u64,
    pub total_shares: u64,
    pub price_per_share: u64,
}

#[event]
pub struct ProjectVerified {
    pub project_id: String,
    pub verifier: Pubkey,
}

#[event]
pub struct SharesPurchased {
    pub project_id: String,
    pub investor: Pubkey,
    pub amount: u64,
    pub total_cost: u64,
}

#[event]
pub struct RevenueDistributed {
    pub project_id: String,
    pub amount: u64,
    pub dividend_per_share: u64,
}

#[event]
pub struct DividendsClaimed {
    pub project_id: String,
    pub investor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CreditsRetired {
    pub project_id: String,
    pub buyer: Pubkey,
    pub amount: u64,
    pub purpose: String,
}

#[event]
pub struct SharesListed {
    pub project_id: String,
    pub seller: Pubkey,
    pub amount: u64,
    pub price_per_share: u64,
}

#[event]
pub struct SharesBought {
    pub project_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub total_cost: u64,
}

#[event]
pub struct ListingCancelled {
    pub project_id: String,
    pub seller: Pubkey,
    pub amount: u64,
}
