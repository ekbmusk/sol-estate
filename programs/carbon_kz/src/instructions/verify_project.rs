use anchor_lang::prelude::*;

use crate::errors::CarbonKZError;
use crate::events::ProjectVerified;
use crate::state::CarbonProject;

#[derive(Accounts)]
pub struct VerifyProject<'info> {
    #[account(
        mut,
        constraint = verifier.key() == project.authority @ CarbonKZError::UnauthorizedVerifier,
    )]
    pub verifier: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project.project_id.as_bytes()],
        bump = project.bump,
    )]
    pub project: Account<'info, CarbonProject>,
}

pub fn handle_verify_project(
    ctx: Context<VerifyProject>,
    doc_hash: [u8; 32],
) -> Result<()> {
    let project = &mut ctx.accounts.project;

    require!(
        project.document_hash == doc_hash,
        CarbonKZError::DocumentHashMismatch
    );

    project.verified = true;

    emit!(ProjectVerified {
        project_id: project.project_id.clone(),
        verifier: ctx.accounts.verifier.key(),
    });

    msg!("Project verified: {}", project.project_id);
    Ok(())
}
