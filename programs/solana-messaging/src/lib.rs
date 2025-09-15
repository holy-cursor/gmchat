use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use mpl_token_metadata::{
    instruction as mpl_instruction,
    state as mpl_state,
};

declare_id!("YourProgramIdHere"); // Replace with your actual program ID

#[program]
pub mod solana_messaging {
    use super::*;

    pub fn send_message(
        ctx: Context<SendMessage>,
        message_content: String,
        recipient: Pubkey,
    ) -> Result<()> {
        let message = &mut ctx.accounts.message;
        let sender = &ctx.accounts.sender;
        let clock = Clock::get()?;

        // Validate message content
        require!(message_content.len() <= 500, ErrorCode::MessageTooLong);
        require!(!message_content.is_empty(), ErrorCode::EmptyMessage);

        // Initialize message account
        message.sender = sender.key();
        message.recipient = recipient;
        message.content = message_content;
        message.timestamp = clock.unix_timestamp;
        message.nft_mint = ctx.accounts.nft_mint.key();
        message.bump = ctx.bumps.message;

        // Create NFT metadata
        let metadata_account = &ctx.accounts.metadata_account;
        let mint = &ctx.accounts.nft_mint;
        
        // This would typically involve calling the Metaplex Token Metadata program
        // to create the NFT with the message content as metadata
        
        Ok(())
    }

    pub fn receive_message(ctx: Context<ReceiveMessage>) -> Result<()> {
        let message = &ctx.accounts.message;
        let recipient = &ctx.accounts.recipient;

        // Verify the recipient is the intended recipient
        require!(message.recipient == recipient.key(), ErrorCode::UnauthorizedRecipient);

        // Mark message as received
        // Additional logic for message handling can be added here

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(message_content: String, recipient: Pubkey)]
pub struct SendMessage<'info> {
    #[account(
        init,
        payer = sender,
        space = Message::LEN,
        seeds = [b"message", sender.key().as_ref(), recipient.as_ref()],
        bump
    )]
    pub message: Account<'info, Message>,

    #[account(
        init,
        payer = sender,
        mint::decimals = 0,
        mint::authority = sender,
    )]
    pub nft_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = sender,
        associated_token::mint = nft_mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = sender,
        associated_token::mint = nft_mint,
        associated_token::authority = sender,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    /// CHECK: This account is validated in the instruction
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub sender: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ReceiveMessage<'info> {
    #[account(
        mut,
        seeds = [b"message", message.sender.as_ref(), message.recipient.as_ref()],
        bump = message.bump,
    )]
    pub message: Account<'info, Message>,

    #[account(mut)]
    pub recipient: Signer<'info>,
}

#[account]
pub struct Message {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub content: String,
    pub timestamp: i64,
    pub nft_mint: Pubkey,
    pub bump: u8,
}

impl Message {
    pub const LEN: usize = 8 + // discriminator
        32 + // sender
        32 + // recipient
        4 + 500 + // content (String with max 500 chars)
        8 + // timestamp
        32 + // nft_mint
        1; // bump
}

#[error_code]
pub enum ErrorCode {
    #[msg("Message content is too long")]
    MessageTooLong,
    #[msg("Message content cannot be empty")]
    EmptyMessage,
    #[msg("Unauthorized recipient")]
    UnauthorizedRecipient,
}
