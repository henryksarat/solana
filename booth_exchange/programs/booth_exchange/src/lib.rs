use anchor_lang::prelude::*;
use anchor_spl::token::{Token, MintTo, Transfer};
use anchor_spl::token;

declare_id!("FS4tM81VusiHgaKe7Ar7X1fJesJCZho5CCWFELWcpckF");


pub fn assert_with_msg(statement: bool, err: ErrorCode, msg: &str) -> Result<()> {
    if !statement {
        msg!(msg);
        Err(err.into())
    } else {
        Ok(())
    }
}

#[program]
pub mod booth_exchange {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn create(ctx: Context<ExchangeBoothAccounts>, oracle_data: String) -> Result<()> {
        let tweet = &mut ctx.accounts.data_location;
        
        let payer: &Signer = &ctx.accounts.payer;
        let admin: &Signer = &ctx.accounts.admin;
        let system_program = &ctx.accounts.system_program.to_account_info();
        let mint_a = &ctx.accounts.mint_a.to_account_info();
        let mint_b = &ctx.accounts.mint_b.to_account_info();
        let vault_a = &ctx.accounts.vault_a.to_account_info();
        let vault_b = &ctx.accounts.vault_b.to_account_info();
        
        tweet.payer = *payer.key;
        tweet.program_id = *system_program.key;
        tweet.mint_a = *mint_a.key;
        tweet.mint_b = *mint_b.key;
        tweet.vault_a = *vault_a.key;
        tweet.vault_b = *vault_b.key;
        tweet.call_count = 23;
        tweet.oracle = oracle_data;
        tweet.admin = *admin.key;
        tweet.bump = *ctx.bumps.get("data_location").unwrap();

        Ok(())
    }

    pub fn super_simple(ctx: Context<SuperSimpleLengthAccounts>) -> Result<()> {
        msg!("in super simple!!");
        
        let tweet = &mut ctx.accounts.data_location;
        tweet.call_count = 59;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SuperSimpleLengthAccounts<'info> {
    #[account(
        init, 
        payer = admin,
        space = SuperSimpleSave::LEN
    )]
    pub data_location: Account<'info, SuperSimpleSave>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction()]
pub struct ExchangeBoothAccounts<'info> {
    #[account(
        init, 
        payer = payer,
        space = ExchangeBooth::LEN,
        seeds=[
            b"ebpda", 
            admin.key().as_ref(), 
            mint_a.key().as_ref(),
            mint_b.key().as_ref()
        ],
        bump
    )]
    pub data_location: Account<'info, ExchangeBooth>,

    #[account(mut)]
    pub payer: Signer<'info>, 

    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,

    /// CHECK: Some token
    pub mint_a: UncheckedAccount<'info>,

    /// CHECK: Some token
    pub mint_b: UncheckedAccount<'info>,
    /// CHECK: Need to be able to update the amount
    #[account(mut)]
    pub vault_a: UncheckedAccount<'info>,

    /// CHECK: Need to be able to update the amount
    #[account(mut)]
    pub vault_b: UncheckedAccount<'info>
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
// #[derive(Default)]
pub struct ExchangeBooth {
    pub payer: Pubkey,
    pub admin: Pubkey,
    pub mint_a: Pubkey, // Needed for decimal value
    pub mint_b: Pubkey, // Needed for decimal value
    pub vault_a: Pubkey, // Associated Token Account for A
    pub vault_b: Pubkey, // Associated Token Account for A
    pub call_count: i32,
    pub oracle: String,
    pub program_id: Pubkey,
    pub bump: u8,
}

#[account]
pub struct SuperSimpleSave {
    pub call_count: i32,
}

const BUMP_LENGTH: usize = 1;
const DISCRIMINATOR_LENGTH: usize = 8; // Required to store the type of account
const PUBLIC_KEY_LENGTH: usize = 32; // [u8, 32] - u8 is 8 bits and that is 1 byte. So a total of 32 bytes
const CALL_COUNT_LENGTH: usize = 4;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 15 * 4; // 15 char max. A UTF-8 encoded chracter can be between 1-4 bytes each

impl ExchangeBooth {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Payer
        + PUBLIC_KEY_LENGTH // Admin
        + PUBLIC_KEY_LENGTH // MintA.
        + PUBLIC_KEY_LENGTH // MintB.
        + PUBLIC_KEY_LENGTH // Vault A.
        + PUBLIC_KEY_LENGTH // Vault B.
        + PUBLIC_KEY_LENGTH // Program Id
        + BUMP_LENGTH
        + CALL_COUNT_LENGTH
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH; // Topic.
}

impl SuperSimpleSave {
    const LEN: usize = DISCRIMINATOR_LENGTH + CALL_COUNT_LENGTH;
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
