use anchor_lang::prelude::*;

#[error_code]
pub enum CarbonKZError {
    #[msg("Project is not accepting investments")]
    ProjectNotActive,
    #[msg("Project is not verified")]
    ProjectNotVerified,
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
    #[msg("Insufficient credits to retire")]
    InsufficientCredits,
    #[msg("Listing not found")]
    ListingNotFound,
    #[msg("Unauthorized verifier")]
    UnauthorizedVerifier,
    #[msg("Unauthorized")]
    Unauthorized,
}
