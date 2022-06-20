use anchor_lang::prelude::*;
use anchor_spl::token::{Token, MintTo, Transfer};
use anchor_spl::token;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod booth_exchange {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn create(ctx: Context<ExchangeBoothAccounts>, data_to_store: String) -> Result<()> {
        let tweet: &mut Account<ExchangeBooth> = &mut ctx.accounts.data_location;
        let author: &Signer = &ctx.accounts.admin;


        msg!(" in here!!");
        tweet.admin = *author.key;
        tweet.call_count = 23;
        tweet.content = data_to_store;

        Ok(())
    }

    // Created this for each of testing
    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        // Create the MintTo struct for our context
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        // Create the CpiContext we need for the request
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Execute anchor's helper function to mint tokens
        token::mint_to(cpi_ctx, amount)?;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ExchangeBoothAccounts<'info> {
    #[account(init, payer = admin, space = ExchangeBooth::LEN)]
    pub data_location: Account<'info, ExchangeBooth>,

    #[account(mut)]
    pub admin: Signer<'info>,
    // #[account(address = system_program::ID)]
    // pub system_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
pub struct ExchangeBooth {
    pub admin: Pubkey,
    pub call_count: i32,
    pub content: String,
}


const DISCRIMINATOR_LENGTH: usize = 8; // Required to store the type of account
const PUBLIC_KEY_LENGTH: usize = 32; // [u8, 32] - u8 is 8 bits and that is 1 byte. So a total of 32 bytes
const CALL_COUNT_LENGTH: usize = 4;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 15 * 4; // 15 char max. A UTF-8 encoded chracter can be between 1-4 bytes each


impl ExchangeBooth {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + CALL_COUNT_LENGTH
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH; // Topic.
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    /// CHECK: This is the token that we want to mint
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is the token account that we want to mint tokens to
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    /// CHECK: the authority of the mint account
    #[account(mut)]
    pub authority: AccountInfo<'info>,
}