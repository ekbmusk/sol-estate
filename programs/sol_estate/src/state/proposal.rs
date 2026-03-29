use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub property: Pubkey,
    pub creator: Pubkey,
    #[max_len(256)]
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub deadline: i64,
    pub executed: bool,
    pub proposal_id: u64,
    pub bump: u8,
}
