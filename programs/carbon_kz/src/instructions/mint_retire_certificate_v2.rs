use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{self, spl_token_2022, Token2022},
};
use anchor_spl::associated_token::spl_associated_token_account;
use mpl_token_metadata::{
    instructions::CreateMetadataAccountV3InstructionArgs,
    types::DataV2,
    ID as TOKEN_METADATA_PROGRAM_ID,
};

use crate::state::{CarbonProject, RetireRecord};

/// Mint a soulbound (non-transferable) NFT certificate using Token-2022.
/// Uses the NonTransferable mint extension — the token can never be transferred.
#[derive(Accounts)]
pub struct MintRetireCertificateV2<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
    )]
    pub project: Account<'info, CarbonProject>,

    /// The RetireRecord that this certificate is for
    pub retire_record: Account<'info, RetireRecord>,

    /// New mint for the NFT — created via raw instructions to support Token-2022 extensions.
    /// CHECK: We create and initialize this account manually with NonTransferable extension.
    #[account(mut, signer)]
    pub certificate_mint: AccountInfo<'info>,

    /// CHECK: Created via associated token program for Token-2022
    #[account(mut)]
    pub certificate_token_account: AccountInfo<'info>,

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
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_mint_retire_certificate_v2(
    ctx: Context<MintRetireCertificateV2>,
    metadata_uri: String,
) -> Result<()> {
    let record = &ctx.accounts.retire_record;
    let project = &ctx.accounts.project;
    let buyer = &ctx.accounts.buyer;
    let certificate_mint = &ctx.accounts.certificate_mint;
    let system_program = &ctx.accounts.system_program;
    let token_program = &ctx.accounts.token_program;

    // Step 1: Calculate space for mint with NonTransferable extension
    // Mint account: 82 bytes base + extension overhead
    // NonTransferable extension: type (2) + length (2) + data (0) = 4 bytes
    // Account type: 1 byte
    // Total: 82 (base mint) + 1 (account type) + 4 (extension header) + 4 (non-transferable) = 234
    // Using get_account_len for accuracy
    let extension_types = &[spl_token_2022::extension::ExtensionType::NonTransferable];
    let mint_len = spl_token_2022::extension::ExtensionType::try_calculate_account_len::<
        spl_token_2022::state::Mint,
    >(extension_types)
    .map_err(|_| error!(ErrorCode::AccountDidNotSerialize))?;

    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(mint_len);

    // Step 2: Create the mint account
    invoke(
        &anchor_lang::solana_program::system_instruction::create_account(
            buyer.key,
            certificate_mint.key,
            lamports,
            mint_len as u64,
            &spl_token_2022::id(),
        ),
        &[
            buyer.to_account_info(),
            certificate_mint.to_account_info(),
            system_program.to_account_info(),
        ],
    )?;

    // Step 3: Initialize NonTransferable extension (MUST be before InitializeMint)
    invoke(
        &spl_token_2022::instruction::initialize_non_transferable_mint(
            &spl_token_2022::id(),
            certificate_mint.key,
        )?,
        &[certificate_mint.to_account_info()],
    )?;

    // Step 4: Initialize the mint (0 decimals, authority = buyer)
    invoke(
        &spl_token_2022::instruction::initialize_mint2(
            &spl_token_2022::id(),
            certificate_mint.key,
            buyer.key,
            Some(buyer.key),
            0,
        )?,
        &[certificate_mint.to_account_info()],
    )?;

    // Step 5: Create ATA for Token-2022
    invoke(
        &spl_associated_token_account::instruction::create_associated_token_account_idempotent(
            buyer.key,
            buyer.key,
            certificate_mint.key,
            &spl_token_2022::id(),
        ),
        &[
            buyer.to_account_info(),
            ctx.accounts.certificate_token_account.to_account_info(),
            buyer.to_account_info(),
            certificate_mint.to_account_info(),
            system_program.to_account_info(),
            token_program.to_account_info(),
        ],
    )?;

    // Step 6: Mint 1 NFT
    token_2022::mint_to(
        CpiContext::new(
            token_program.to_account_info(),
            token_2022::MintTo {
                mint: certificate_mint.to_account_info(),
                to: ctx.accounts.certificate_token_account.to_account_info(),
                authority: buyer.to_account_info(),
            },
        ),
        1,
    )?;

    // Step 7: Create Metaplex metadata
    let name = format!(
        "Carbon Retire #{} — {} tCO₂",
        record.amount_retired, project.project_id
    );
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
        is_mutable: false,
        collection_details: None,
    };

    let ix = mpl_token_metadata::instructions::CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: certificate_mint.key(),
        mint_authority: buyer.key(),
        payer: buyer.key(),
        update_authority: (buyer.key(), false),
        system_program: system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    let account_infos = &[
        ctx.accounts.metadata.to_account_info(),
        certificate_mint.to_account_info(),
        buyer.to_account_info(),
        buyer.to_account_info(),
        buyer.to_account_info(),
        system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];

    let cpi_ix = ix.instruction(args);
    invoke(&cpi_ix, account_infos)?;

    msg!(
        "Soulbound retire certificate minted (Token-2022 NonTransferable): {} tCO₂ for project {}",
        record.amount_retired,
        project.project_id
    );
    Ok(())
}
