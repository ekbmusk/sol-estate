use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_token_metadata::{
    instructions::CreateMetadataAccountV3InstructionArgs,
    types::DataV2,
    ID as TOKEN_METADATA_PROGRAM_ID,
};

use crate::state::CarbonProject;

#[derive(Accounts)]
pub struct CreateCarbonMetadata<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
        has_one = authority,
    )]
    pub project: Account<'info, CarbonProject>,

    #[account(
        seeds = [b"carbon_mint", project.project_id.as_bytes()],
        bump,
        constraint = carbon_mint.key() == project.carbon_mint,
    )]
    pub carbon_mint: Account<'info, Mint>,

    /// CHECK: Created by Metaplex via CPI
    #[account(
        mut,
        seeds = [
            b"metadata",
            TOKEN_METADATA_PROGRAM_ID.as_ref(),
            carbon_mint.key().as_ref(),
        ],
        bump,
        seeds::program = TOKEN_METADATA_PROGRAM_ID,
    )]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metaplex Token Metadata program
    #[account(address = TOKEN_METADATA_PROGRAM_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_create_carbon_metadata(
    ctx: Context<CreateCarbonMetadata>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    let project = &ctx.accounts.project;

    let data_v2 = DataV2 {
        name,
        symbol,
        uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let args = CreateMetadataAccountV3InstructionArgs {
        data: data_v2,
        is_mutable: true,
        collection_details: None,
    };

    let ix = mpl_token_metadata::instructions::CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: ctx.accounts.carbon_mint.key(),
        mint_authority: ctx.accounts.project.key(),
        payer: ctx.accounts.authority.key(),
        update_authority: (ctx.accounts.project.key(), true),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    let account_infos = &[
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.carbon_mint.to_account_info(),
        ctx.accounts.project.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.project.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
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

    msg!("Carbon metadata created for {}", project.project_id);
    Ok(())
}
