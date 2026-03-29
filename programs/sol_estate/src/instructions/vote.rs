use anchor_lang::prelude::*;

use crate::errors::SolEstateError;
use crate::events::VoteCast;
use crate::state::{InvestorRecord, PropertyAccount, Proposal, VoteRecord};

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        seeds = [b"property", property.property_id.as_bytes()],
        bump = property.bump,
    )]
    pub property: Account<'info, PropertyAccount>,

    #[account(
        mut,
        seeds = [b"proposal", property.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        seeds = [b"investor", property.key().as_ref(), voter.key().as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}

pub fn handle_vote(ctx: Context<Vote>, approve: bool) -> Result<()> {
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp <= ctx.accounts.proposal.deadline,
        SolEstateError::ProposalExpired
    );

    let weight = ctx.accounts.investor_record.shares_owned;
    require!(weight > 0, SolEstateError::InsufficientVotingPower);

    let proposal = &mut ctx.accounts.proposal;
    if approve {
        proposal.votes_for = proposal
            .votes_for
            .checked_add(weight)
            .ok_or(error!(SolEstateError::Overflow))?;
    } else {
        proposal.votes_against = proposal
            .votes_against
            .checked_add(weight)
            .ok_or(error!(SolEstateError::Overflow))?;
    }

    let vote_record = &mut ctx.accounts.vote_record;
    vote_record.voter = ctx.accounts.voter.key();
    vote_record.proposal = ctx.accounts.proposal.key();
    vote_record.bump = ctx.bumps.vote_record;

    emit!(VoteCast {
        proposal_id: ctx.accounts.proposal.proposal_id,
        voter: ctx.accounts.voter.key(),
        approve,
        weight,
    });

    msg!("Vote recorded: approve={}, weight={}", approve, weight);
    Ok(())
}
