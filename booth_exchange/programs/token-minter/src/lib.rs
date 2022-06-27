use anchor_lang::prelude::*;
use anchor_spl::token::{Token, MintTo, Transfer};
use anchor_spl::token;

//declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
declare_id!("FgWP6Y7nfHse7w5FmyJQ5gLGiuwVNKmQ1XNV11yyuMmf");

#[program]
pub mod token_minter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
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

    pub fn transfer_token(ctx: Context<TransferToken>, amount: u64) -> Result<()> {
        // Create the Transfer struct for our context
        let transfer_instruction = Transfer{
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.from_authority.to_account_info(),
        };
         
        let cpi_program = ctx.accounts.token_program.to_account_info();
        // Create the Context for our Transfer request
        let cpi_ctx = CpiContext::new(cpi_program, transfer_instruction);

        // Execute anchor's helper function to transfer tokens
        anchor_spl::token::transfer(cpi_ctx, amount)?;
 
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

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

#[derive(Accounts)]
pub struct TransferToken<'info> {
    pub token_program: Program<'info, Token>,
    /// CHECK: The associated token account that we are transferring the token from
    #[account(mut)]
    pub from: UncheckedAccount<'info>,
    /// CHECK: The associated token account that we are transferring the token to
    #[account(mut)]
    pub to: AccountInfo<'info>,
    // the authority of the from account 
    pub from_authority: Signer<'info>,
}