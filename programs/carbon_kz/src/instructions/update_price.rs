use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};

use crate::errors::CarbonKZError;
use crate::state::{CarbonProject, OracleConfig};

/// Maximum age of Pyth price update (seconds)
const MAXIMUM_AGE: u64 = 120;

/// Default USD/KZT rate × 100 (485.00 KZT per 1 USD)
const DEFAULT_USD_KZT_RATE: u64 = 48500;

// EU ETS Carbon Allowance feed ID (Pyth)
// For devnet demo, we use this feed. Production should verify the exact feed.
const CARBON_FEED_ID: &str = "0xc9dfb04e711c90708ccab8cb7e3e9b2b765f47f2deb60375b432e813d93a7142";

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
        has_one = authority @ CarbonKZError::Unauthorized,
    )]
    pub project: Account<'info, CarbonProject>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + OracleConfig::INIT_SPACE,
        seeds = [b"oracle", project.key().as_ref()],
        bump,
    )]
    pub oracle_config: Account<'info, OracleConfig>,

    /// Pyth PriceUpdateV2 account — posted by client before calling this instruction
    pub price_update: Account<'info, PriceUpdateV2>,

    pub system_program: Program<'info, System>,
}

pub fn handle_update_price(
    ctx: Context<UpdatePrice>,
    feed_id_hex: Option<String>,
    usd_to_kzt_rate: Option<u64>,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_config;
    let project = &mut ctx.accounts.project;
    let price_update = &ctx.accounts.price_update;
    let clock = Clock::get()?;

    // Determine which feed ID to use
    let feed_id = if let Some(ref hex) = feed_id_hex {
        get_feed_id_from_hex(hex).map_err(|_| CarbonKZError::InvalidFeedId)?
    } else if oracle.feed_id != [0u8; 32] {
        // Re-use previously configured feed ID
        oracle.feed_id
    } else {
        // Default to carbon feed
        get_feed_id_from_hex(CARBON_FEED_ID).map_err(|_| CarbonKZError::InvalidFeedId)?
    };

    // Read price from Pyth — allow partial verification for devnet flexibility
    let price = price_update
        .get_price_no_older_than_with_custom_verification_level(
            &clock,
            MAXIMUM_AGE,
            &feed_id,
            pyth_solana_receiver_sdk::price_update::VerificationLevel::Partial {
                num_signatures: 0,
            },
        )
        .map_err(|_| CarbonKZError::PriceUpdateStale)?;

    // Convert Pyth price to KZTE (6 decimals)
    // Pyth price: price * 10^exponent (e.g. price=7500, exponent=-2 → $75.00)
    // We need: price_in_kzte = price_usd * usd_kzt_rate / 100 * 10^6 / 10^(-exponent)
    let rate = usd_to_kzt_rate.unwrap_or(
        if oracle.usd_to_kzt_rate > 0 {
            oracle.usd_to_kzt_rate
        } else {
            DEFAULT_USD_KZT_RATE
        },
    );

    // price_in_usd_cents = price.price * 10^(exponent + 2) — normalize to cents
    // For simplicity: price_kzte = |price| * rate * 10^(6 + exponent) / 100
    let abs_price = price.price.unsigned_abs();
    let exponent = price.exponent;

    // Calculate: abs_price * rate / 100, then adjust by 10^(6 + exponent)
    let base = abs_price
        .checked_mul(rate)
        .ok_or(CarbonKZError::Overflow)?;

    let price_kzte = if exponent >= -6 {
        // exponent is >= -6, shift up by (6 + exponent)
        let shift = 10u64.pow((6 + exponent) as u32);
        base.checked_mul(shift)
            .ok_or(CarbonKZError::Overflow)?
            .checked_div(100)
            .ok_or(CarbonKZError::Overflow)?
    } else {
        // exponent < -6, shift down by -(6 + exponent)
        let shift = 10u64.pow((-(6 + exponent)) as u32);
        base.checked_div(shift)
            .ok_or(CarbonKZError::Overflow)?
            .checked_div(100)
            .ok_or(CarbonKZError::Overflow)?
    };

    // Update oracle config
    oracle.project = project.key();
    oracle.feed_id = feed_id;
    oracle.cached_price = price_kzte;
    oracle.last_update = clock.unix_timestamp;
    oracle.usd_to_kzt_rate = rate;
    oracle.bump = ctx.bumps.oracle_config;

    // Update project price_per_share with oracle price
    project.price_per_share = price_kzte;

    msg!(
        "Price updated via Pyth oracle: {} KZTE/credit (raw pyth: {} × 10^{}), rate: {} KZT/USD",
        price_kzte,
        price.price,
        exponent,
        rate as f64 / 100.0
    );

    Ok(())
}
