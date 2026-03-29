use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct InvestorRecord {
    pub owner: Pubkey,
    pub property: Pubkey,
    pub shares_owned: u64,
    pub kzte_invested: u64,
    pub last_claimed: u64,
    pub bump: u8,
}
