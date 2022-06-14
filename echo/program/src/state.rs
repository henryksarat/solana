use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct EchoMessage {
    pub call_count: u64,
    // pub counter: Pubkey,
    pub message: String,
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct DataLength {
  pub length: u32,
}

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct AuthorizedEchoMessage {
    pub bump_seed: u8, 
    pub buffer_seed: u8,  
    pub call_count: u64,
    pub message: String,
}