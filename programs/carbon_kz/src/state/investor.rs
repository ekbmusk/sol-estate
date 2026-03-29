use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct InvestorRecord {
    pub owner: Pubkey,
    pub project: Pubkey,
    pub shares_owned: u64,
    pub kzte_invested: u64,
    pub last_claimed: u128,
    pub is_initialized: bool,
    pub bump: u8,
}
