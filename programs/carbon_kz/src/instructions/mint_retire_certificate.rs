use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::{
    instructions::CreateMetadataAccountV3InstructionArgs,
    types::DataV2,
    ID as TOKEN_METADATA_PROGRAM_ID,
};

use crate::state::{CarbonProject, RetireRecord};

/// Mint an NFT certificate after retiring carbon credits.
/// The NFT proves on-chain that the buyer retired X tons of CO₂.
/// Metadata URI points to our API which generates the certificate image.
#[derive(Accounts)]
pub struct MintRetireCertificate<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
    )]
    pub project: Account<'info, CarbonProject>,

    /// The RetireRecord that this certificate is for
    pub retire_record: Account<'info, RetireRecord>,

    /// New mint for the NFT (1 supply, 0 decimals)
    #[account(
        init,
        payer = buyer,
        mint::decimals = 0,
        mint::authority = buyer,
        mint::freeze_authority = buyer,
    )]
    pub certificate_mint: Account<'info, Mint>,

    /// Buyer's token account for the NFT
    #[account(
        init,
        payer = buyer,
        associated_token::mint = certificate_mint,
        associated_token::authority = buyer,
    )]
    pub certificate_token_account: Account<'info, TokenAccount>,

    /// CHECK: Created by Metaplex via CPI
    #[account(
        mut,
        seeds = [
            b"metadata",
            TOKEN_METADATA_PROGRAM_ID.as_ref(),
            certificate_mint.key().as_ref(),
        ],
        bump,
        seeds::program = TOKEN_METADATA_PROGRAM_ID,
    )]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata program
    #[account(address = TOKEN_METADATA_PROGRAM_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_mint_retire_certificate(
    ctx: Context<MintRetireCertificate>,
    metadata_uri: String,
) -> Result<()> {
    let record = &ctx.accounts.retire_record;
    let project = &ctx.accounts.project;

    // Mint 1 NFT to buyer
    let mint_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.certificate_mint.to_account_info(),
            to: ctx.accounts.certificate_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::mint_to(mint_ctx, 1)?;

    // Create metadata
    let name = format!(
        "Carbon Retire #{} — {} tCO₂",
        record.amount_retired,
        project.project_id
    );
    // Truncate name to 32 chars (Metaplex limit)
    let name = if name.len() > 32 {
        name[..32].to_string()
    } else {
        name
    };

    let data_v2 = DataV2 {
        name,
        symbol: "CRBN".to_string(),
        uri: metadata_uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let args = CreateMetadataAccountV3InstructionArgs {
        data: data_v2,
        is_mutable: false, // immutable — certificate cannot be changed
        collection_details: None,
    };

    let ix = mpl_token_metadata::instructions::CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: ctx.accounts.certificate_mint.key(),
        mint_authority: ctx.accounts.buyer.key(),
        payer: ctx.accounts.buyer.key(),
        update_authority: (ctx.accounts.buyer.key(), false), // not updatable
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    let account_infos = &[
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.certificate_mint.to_account_info(),
        ctx.accounts.buyer.to_account_info(),
        ctx.accounts.buyer.to_account_info(),
        ctx.accounts.buyer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    let cpi_ix = ix.instruction(args);
    anchor_lang::solana_program::program::invoke(&cpi_ix, account_infos)?;

    msg!(
        "Retire certificate NFT minted: {} tCO₂ for project {}",
        record.amount_retired,
        project.project_id
    );
    Ok(())
}
