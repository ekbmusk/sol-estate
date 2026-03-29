use anchor_lang::prelude::*;

use crate::errors::SolEstateError;
use crate::state::{InvestorRecord, PropertyAccount, Proposal};

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        seeds = [b"property", property.property_id.as_bytes()],
        bump = property.bump,
    )]
    pub property: Account<'info, PropertyAccount>,

    #[account(
        seeds = [b"investor", property.key().as_ref(), creator.key().as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    #[account(
        init,
        payer = creator,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", property.key().as_ref(), &proposal_id.to_le_bytes()],
        bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_proposal(
    ctx: Context<CreateProposal>,
    proposal_id: u64,
    description: String,
    duration_seconds: i64,
) -> Result<()> {
    require!(
        ctx.accounts.investor_record.shares_owned > 0,
        SolEstateError::InsufficientVotingPower
    );

    let clock = Clock::get()?;
    let deadline = clock
        .unix_timestamp
        .checked_add(duration_seconds)
        .ok_or(error!(SolEstateError::Overflow))?;

    let proposal = &mut ctx.accounts.proposal;
    proposal.property = ctx.accounts.property.key();
    proposal.creator = ctx.accounts.creator.key();
    proposal.description = description;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.deadline = deadline;
    proposal.executed = false;
    proposal.proposal_id = proposal_id;
    proposal.bump = ctx.bumps.proposal;

    msg!("Proposal {} created", proposal_id);
    Ok(())
}
