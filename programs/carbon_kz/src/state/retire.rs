use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RetireRecord {
    pub buyer: Pubkey,
    pub project: Pubkey,
    pub amount_retired: u64,
    pub timestamp: i64,
    #[max_len(128)]
    pub purpose: String,
    pub bump: u8,
}
