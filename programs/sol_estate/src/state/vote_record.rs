use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub bump: u8,
}
