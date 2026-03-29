use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;
use state::ProjectType;

declare_id!("AtqkY8tyT9AwUe7JPDFnGuFoFtfXcj264AVEJWtMnL2u");

#[program]
pub mod carbon_kz {
    use super::*;

    // ── Wave 1 ──────────────────────────────────────────────

    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        project_id: String,
        name: String,
        project_type: ProjectType,
        total_credits: u64,
        total_shares: u64,
        price_per_share: u64,
        document_hash: [u8; 32],
    ) -> Result<()> {
        instructions::initialize_project::handle_initialize_project(
            ctx,
            project_id,
            name,
            project_type,
            total_credits,
            total_shares,
            price_per_share,
            document_hash,
        )
    }

    pub fn verify_project(ctx: Context<VerifyProject>, doc_hash: [u8; 32]) -> Result<()> {
        instructions::verify_project::handle_verify_project(ctx, doc_hash)
    }

    pub fn invest(ctx: Context<Invest>, amount: u64) -> Result<()> {
        instructions::invest::handle_invest(ctx, amount)
    }

    pub fn distribute_revenue(ctx: Context<DistributeRevenue>, amount: u64) -> Result<()> {
        instructions::distribute_revenue::handle_distribute_revenue(ctx, amount)
    }

    pub fn claim_dividends(ctx: Context<ClaimDividends>) -> Result<()> {
        instructions::claim_dividends::handle_claim_dividends(ctx)
    }

    pub fn retire_credits(
        ctx: Context<RetireCredits>,
        retire_id: [u8; 16],
        amount: u64,
        purpose: String,
    ) -> Result<()> {
        instructions::retire_credits::handle_retire_credits(ctx, retire_id, amount, purpose)
    }

    pub fn mint_carbon_tokens(ctx: Context<MintCarbonTokens>, amount: u64) -> Result<()> {
        instructions::mint_carbon_tokens::handle_mint_carbon_tokens(ctx, amount)
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

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::cancel_listing::handle_cancel_listing(ctx)
    }

    // ── Metadata ────────────────────────────────────────────

    pub fn create_share_metadata(
        ctx: Context<CreateShareMetadata>,
        name: String,
        symbol: String,
    ) -> Result<()> {
        instructions::create_share_metadata::handle_create_share_metadata(ctx, name, symbol)
    }
}
