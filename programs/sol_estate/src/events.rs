use anchor_lang::prelude::*;

#[event]
pub struct PropertyInitialized {
    pub property_id: String,
    pub authority: Pubkey,
    pub total_shares: u64,
    pub price_per_share: u64,
}

#[event]
pub struct SharesPurchased {
    pub property_id: String,
    pub investor: Pubkey,
    pub amount: u64,
    pub total_cost: u64,
}

#[event]
pub struct DividendsDistributed {
    pub property_id: String,
    pub amount: u64,
    pub dividend_per_share: u64,
}

#[event]
pub struct DividendsClaimed {
    pub property_id: String,
    pub investor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct SharesListed {
    pub property_id: String,
    pub seller: Pubkey,
    pub amount: u64,
    pub price_per_share: u64,
}

#[event]
pub struct SharesBought {
    pub property_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub total_cost: u64,
}

#[event]
pub struct ProposalCreated {
    pub property_id: String,
    pub proposal_id: u64,
    pub creator: Pubkey,
    pub deadline: i64,
}

#[event]
pub struct VoteCast {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub approve: bool,
    pub weight: u64,
}

#[event]
pub struct ListingCancelled {
    pub property_id: String,
    pub seller: Pubkey,
    pub amount: u64,
}
