use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct VaultAccount {
    pub property: Pubkey,
    pub kzte_mint: Pubkey,
    pub total_deposited: u64,
    pub total_claimed: u64,
    pub bump: u8,
}
