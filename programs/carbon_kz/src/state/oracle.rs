use anchor_lang::prelude::*;

/// Oracle configuration for a project — stores Pyth price feed reference and cached price.
/// Separate PDA to avoid breaking existing CarbonProject account layout.
#[account]
#[derive(InitSpace)]
pub struct OracleConfig {
    pub project: Pubkey,
    pub feed_id: [u8; 32],       // Pyth price feed ID (e.g. EU ETS carbon)
    pub cached_price: u64,        // last known price in KZTE (6 decimals)
    pub last_update: i64,         // unix timestamp of last oracle update
    pub usd_to_kzt_rate: u64,    // USD/KZT rate × 100 (e.g. 48500 = 485.00 KZT/USD)
    pub bump: u8,
}
