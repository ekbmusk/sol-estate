use anchor_lang::prelude::*;

#[error_code]
pub enum SolEstateError {
    #[msg("Property is not accepting investments")]
    PropertyNotActive,
    #[msg("Investment amount too small")]
    AmountTooSmall,
    #[msg("Not enough shares available")]
    InsufficientShares,
    #[msg("Document hash does not match")]
    DocumentHashMismatch,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("No dividends to claim")]
    NothingToClaim,
    #[msg("Insufficient voting power")]
    InsufficientVotingPower,
    #[msg("Listing not found")]
    ListingNotFound,
    #[msg("Proposal has expired")]
    ProposalExpired,
    #[msg("Already voted")]
    AlreadyVoted,
}
