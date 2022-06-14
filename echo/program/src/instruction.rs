use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum EchoInstruction {
    Add, // unsigned byte
    Delete,
    InitializeAuthorizedEcho,
    AuthorizedEcho
}
