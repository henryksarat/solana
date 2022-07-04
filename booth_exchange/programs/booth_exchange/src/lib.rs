use anchor_lang::prelude::*;
use anchor_spl::token::{Token, MintTo, Transfer, TokenAccount};
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
        msg!("in create");
        
        let tweet = &mut ctx.accounts.data_location;
        
        let payer: &Signer = &ctx.accounts.payer;
        let admin: &Signer = &ctx.accounts.admin;
        let system_program = &ctx.accounts.system_program.to_account_info();
        let mint_a = &ctx.accounts.mint_a.to_account_info();
        let mint_b = &ctx.accounts.mint_b.to_account_info();
        let vault_a = &ctx.accounts.vault_a_pda_key.to_account_info();
        let vault_b = &ctx.accounts.vault_b_pda_key.to_account_info();

        tweet.payer = *payer.key;
        tweet.program_id = *system_program.key;
        tweet.mint_a = *mint_a.key;
        tweet.mint_b = *mint_b.key;
        tweet.vault_a = *vault_a.key;
        tweet.vault_b = *vault_b.key;
        tweet.oracle = oracle_data;
        tweet.admin = *admin.key;
        tweet.bump = *ctx.bumps.get("data_location").unwrap();

        Ok(())
    }

    pub fn super_simple(ctx: Context<SuperSimpleLengthAccounts>) -> Result<()> {
        msg!("in super simple");
        
        let tweet = &mut ctx.accounts.data_location;
        tweet.call_count = 59;

        Ok(())
    }

    pub fn deposit(
        ctx: Context<DeepositAccounts>, 
        vault_a_deposit_amount: u64, 
        vault_b_deposit_amount: u64,
    ) -> Result<()> {
        msg!("in deposit");
        
        let mint_a = &ctx.accounts.mint_a.to_account_info();
        let mint_b = &ctx.accounts.mint_b.to_account_info();
        let programm_id = &ctx.accounts.programm_id.to_account_info();

        let tweet = &mut ctx.accounts.data_location;

        let vault_a_pda = &mut ctx.accounts.vault_a_pda.to_account_info();
        let vault_b_pda = &mut ctx.accounts.vault_b_pda.to_account_info();


        let (vault_a_auth_key, _) = Pubkey::find_program_address(
            &[
                b"EBVaultA",
                mint_a.key.as_ref(),
            ],
            programm_id.key,
        );
        
        if *vault_a_pda.key != tweet.vault_a || *vault_a_pda.key != vault_a_auth_key {
            return Err(ErrorCode::VaultAIncorrect.into())
        }

        let (vault_b_auth_key, _) = Pubkey::find_program_address(
            &[
                b"EBVaultB",
                mint_b.key.as_ref(),
            ],
            programm_id.key,
        );

        if *vault_b_pda.key != tweet.vault_b || *vault_b_pda.key != vault_b_auth_key {
            return Err(ErrorCode::VaultBIncorrect.into())
        }

        let transfer_instruction_vault_a = Transfer{
            from: ctx.accounts.vault_a_transfer_out_of.to_account_info(),
            to: ctx.accounts.vault_a_pda.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        
        let cpi_program_vault_a = ctx.accounts.token_program.to_account_info();

        let cpi_ctx_vault_a = CpiContext::new(cpi_program_vault_a, transfer_instruction_vault_a);

        anchor_spl::token::transfer(cpi_ctx_vault_a, vault_a_deposit_amount)?;


        let transfer_instruction_vault_b = Transfer{
            from: ctx.accounts.vault_b_transfer_out_of.to_account_info(),
            to: ctx.accounts.vault_b_pda.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        
        let cpi_program_vault_b = ctx.accounts.token_program.to_account_info();

        let cpi_ctx_vault_b = CpiContext::new(cpi_program_vault_b, transfer_instruction_vault_b);

        anchor_spl::token::transfer(cpi_ctx_vault_b, vault_b_deposit_amount)?;

        Ok(())
    }

    // We want to transfer amount of A for B
    // We have to remove amount from Customer Wallet A and send to Vault A
    // We have to remove amount * exchange of 2 from Vault B and send to Customer Wallet B
    pub fn execute_trade(ctx: Context<ExecuteTradeAccounts>, amount: u64) -> Result<()> {
        msg!("in trade");
        
        let tweet = &mut ctx.accounts.data_location;
        
        let mut split = tweet.oracle.split(":");

        let vault_a_exchange = split.next();
        let vault_b_exchange = split.next();

        msg!("oracle={}", tweet.oracle);
        msg!("a exhcange={}", vault_a_exchange.unwrap());
        msg!("b exhcange={}", vault_b_exchange.unwrap());


        let transfer_instruction = Transfer{
            from: ctx.accounts.vault_a_customer.to_account_info(),
            to: ctx.accounts.vault_a_pda.to_account_info(),
            authority: ctx.accounts.customer.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_ctx = CpiContext::new(cpi_program, transfer_instruction);

        anchor_spl::token::transfer(cpi_ctx, amount)?;

        let transfer_instruction_b = Transfer{
            from: ctx.accounts.vault_b_pda.to_account_info(),
            to: ctx.accounts.vault_b_customer.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        
        let cpi_program_b = ctx.accounts.token_program.to_account_info();

        let cpi_ctx_b = CpiContext::new(cpi_program_b, transfer_instruction_b);

        let amount_to_multiply: u64 = vault_b_exchange.unwrap().parse().unwrap();
        let amount_for_b = amount * amount_to_multiply;

        anchor_spl::token::transfer(cpi_ctx_b, amount_for_b)?;

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
pub struct ExecuteTradeAccounts<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds=[
            b"ebpda", 
            mint_a.key().as_ref(),
            mint_b.key().as_ref()
        ],
        bump
    )]
    pub data_location: Account<'info, ExchangeBooth>,

    /// CHECK: Mint A Token
    pub mint_a: UncheckedAccount<'info>,

    /// CHECK: Mint B Token
    pub mint_b: UncheckedAccount<'info>,

    /// CHECK: When we attempt to transfer with the authority that
    /// will be enough of a check
    #[account(mut)]
    pub vault_a_customer: UncheckedAccount<'info>,

    /// CHECK: When we attempt to transfer with the authority that
    /// will be enough of a check
    #[account(mut)]
    pub vault_b_customer: UncheckedAccount<'info>,

    /// CHECK: If I do a PDA check here I can't tranfer money for some reason
    /// so I do this unchecked. I do a check inside the function though
    /// to make sure that this is the same key when we did the "create"
    #[account(mut)]
    pub vault_a_pda: UncheckedAccount<'info>,

    /// CHECK: If I do a PDA check here I can't tranfer money for some reason
    /// so I do this unchecked. I do a check inside the function though
    /// to make sure that this is the same key when we did the "create"
    #[account(mut)]
    pub vault_b_pda: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub payer: Signer<'info>, 

    #[account(mut)]
    pub customer: Signer<'info>, 

    /// CHECK: I can't spell this program_id for some reason but
    /// I pass this in still because I want to verify the PDA
    /// for vault_a_pda and vault_b_pda manually in "deposit"
    pub programm_id: UncheckedAccount<'info>,

    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DeepositAccounts<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds=[
            b"ebpda", 
            mint_a.key().as_ref(),
            mint_b.key().as_ref()
        ],
        bump
    )]
    pub data_location: Account<'info, ExchangeBooth>,

    /// CHECK: Mint A Token
    pub mint_a: UncheckedAccount<'info>,

    /// CHECK: Mint B Token
    pub mint_b: UncheckedAccount<'info>,

    /// CHECK: When we attempt to transfer with the authority that
    /// will be enough of a check
    #[account(mut)]
    pub vault_a_transfer_out_of: UncheckedAccount<'info>,

    /// CHECK: When we attempt to transfer with the authority that
    /// will be enough of a check
    #[account(mut)]
    pub vault_b_transfer_out_of: UncheckedAccount<'info>,

    /// CHECK: If I do a PDA check here I can't tranfer money for some reason
    /// so I do this unchecked. I do a check inside the function though
    /// to make sure that this is the same key when we did the "create"
    #[account(mut)]
    pub vault_a_pda: UncheckedAccount<'info>,

    /// CHECK: If I do a PDA check here I can't tranfer money for some reason
    /// so I do this unchecked. I do a check inside the function though
    /// to make sure that this is the same key when we did the "create"
    #[account(mut)]
    pub vault_b_pda: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    #[account(mut)]
    pub payer: Signer<'info>, 

    /// CHECK: I can't spell this program_id for some reason but
    /// I pass this in still because I want to verify the PDA
    /// for vault_a_pda and vault_b_pda manually in "deposit"
    pub programm_id: UncheckedAccount<'info>,

    token_program: Program<'info, Token>,
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
            // admin.key().as_ref(), 
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

    #[account(
        init,
        payer = payer,
        seeds=[
            b"EBVaultA", 
            mint_a.key().as_ref(),
            // admin.key().as_ref()
        ],
        bump,
        token::mint=mint_a,
        token::authority=admin,
    )]
    pub vault_a_pda_key: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = payer,
        seeds=[
            b"EBVaultB", 
            mint_b.key().as_ref(),
            // admin.key().as_ref()
        ],
        bump,
        token::mint=mint_b,
        token::authority=admin,
    )]
    pub vault_b_pda_key: Account<'info, TokenAccount>,
    rent: Sysvar<'info, Rent>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
pub struct ExchangeBooth {
    pub payer: Pubkey,
    pub admin: Pubkey,
    pub mint_a: Pubkey, // Needed for decimal value
    pub mint_b: Pubkey, // Needed for decimal value
    pub vault_a: Pubkey, // Associated Token Account for A
    pub vault_b: Pubkey, // Associated Token Account for A

    // // Can be address to somewhere that holds the info
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
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH; // Topic.
}

impl SuperSimpleSave {
    const LEN: usize = DISCRIMINATOR_LENGTH + CALL_COUNT_LENGTH;
}

// #[derive(Accounts)]
// pub struct TransferToken<'info> {
//     pub token_program: Program<'info, Token>,
//     /// CHECK: The associated token account that we are transferring the token from
//     #[account(mut)]
//     pub from: UncheckedAccount<'info>,
//     /// CHECK: The associated token account that we are transferring the token to
//     #[account(mut)]
//     pub to: AccountInfo<'info>,
//     // the authority of the from account 
//     pub from_authority: Signer<'info>,
// }

#[error_code]
pub enum ErrorCode {
    #[msg("Vault A key is incorrect.")]
    VaultAIncorrect,
    #[msg("Vault B key is incorrect.")]
    VaultBIncorrect,
}