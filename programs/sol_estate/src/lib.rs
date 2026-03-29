use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("AtqkY8tyT9AwUe7JPDFnGuFoFtfXcj264AVEJWtMnL2u");

#[program]
pub mod sol_estate {
    use super::*;

    // ── Wave 1 ──────────────────────────────────────────────

    pub fn initialize_property(
        ctx: Context<InitializeProperty>,
        property_id: String,
        name: String,
        total_shares: u64,
        price_per_share: u64,
        document_hash: [u8; 32],
    ) -> Result<()> {
        instructions::initialize_property::handle_initialize_property(
            ctx,
            property_id,
            name,
            total_shares,
            price_per_share,
            document_hash,
        )
    }

    pub fn invest(ctx: Context<Invest>, amount: u64) -> Result<()> {
        instructions::invest::handle_invest(ctx, amount)
    }

    pub fn distribute_dividends(ctx: Context<DistributeDividends>, amount: u64) -> Result<()> {
        instructions::distribute_dividends::handle_distribute_dividends(ctx, amount)
    }

    pub fn claim_dividends(ctx: Context<ClaimDividends>) -> Result<()> {
        instructions::claim_dividends::handle_claim_dividends(ctx)
    }

    // ── Wave 2 ──────────────────────────────────────────────

    pub fn list_shares(
        ctx: Context<ListShares>,
        amount: u64,
        price_per_share: u64,
    ) -> Result<()> {
        instructions::list_shares::handle_list_shares(ctx, amount, price_per_share)
    }

    pub fn buy_shares(ctx: Context<BuyShares>) -> Result<()> {
        instructions::buy_shares::handle_buy_shares(ctx)
    }
}
