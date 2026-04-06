use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_token_metadata::{
    instructions::UpdateMetadataAccountV2InstructionArgs,
    types::DataV2,
    ID as TOKEN_METADATA_PROGRAM_ID,
};

use crate::state::CarbonProject;

#[derive(Accounts)]
pub struct UpdateTokenMetadata<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
        has_one = authority,
    )]
    pub project: Account<'info, CarbonProject>,

    /// The mint whose metadata we're updating (share_mint or carbon_mint)
    pub token_mint: Account<'info, Mint>,

    /// CHECK: Validated by seeds constraint
    #[account(
        mut,
        seeds = [
            b"metadata",
            TOKEN_METADATA_PROGRAM_ID.as_ref(),
            token_mint.key().as_ref(),
        ],
        bump,
        seeds::program = TOKEN_METADATA_PROGRAM_ID,
    )]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata program
    #[account(address = TOKEN_METADATA_PROGRAM_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

pub fn handle_update_token_metadata(
    ctx: Context<UpdateTokenMetadata>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    let project = &ctx.accounts.project;

    // Verify the mint belongs to this project
    require!(
        ctx.accounts.token_mint.key() == project.share_mint
            || ctx.accounts.token_mint.key() == project.carbon_mint,
        crate::errors::CarbonKZError::Unauthorized
    );

    let args = UpdateMetadataAccountV2InstructionArgs {
        data: Some(DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        }),
        new_update_authority: None,
        primary_sale_happened: None,
        is_mutable: None,
    };

    let ix = mpl_token_metadata::instructions::UpdateMetadataAccountV2 {
        metadata: ctx.accounts.metadata.key(),
        update_authority: ctx.accounts.project.key(),
    };

    let account_infos = &[
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.project.to_account_info(),
    ];

    let project_id = project.project_id.as_bytes();
    let bump = project.bump;
    let seeds: &[&[u8]] = &[b"project", project_id, &[bump]];
    let signer_seeds = &[seeds];

    let cpi_ix = ix.instruction(args);
    anchor_lang::solana_program::program::invoke_signed(
        &cpi_ix,
        account_infos,
        signer_seeds,
    )?;

    msg!("Token metadata updated for {}", project.project_id);
    Ok(())
}
