use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    borsh::get_instance_packed_len,
};

use crate::padder::{finalize_string_with_padding};
use crate::instruction::EchoInstruction;
use crate::state::EchoMessage;
use crate::state::DataLength;
use crate::state::AuthorizedEchoMessage;
use std::str;

const SIZE_OF_NON_AUTH_ECHO_MESSAGE:u32 = 27;

pub fn assert_with_msg(statement: bool, err: ProgramError, msg: &str) -> ProgramResult {
    if !statement {
        msg!(msg);
        Err(err)
    } else {
        Ok(())
    }
}

pub struct Processor {}

impl Processor {
    pub fn process_instruction(
        _program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction: u8 = *instruction_data.first().unwrap();
        let instruction = EchoInstruction::try_from_slice(&[instruction])
            .map_err(|_| ProgramError::InvalidInstructionData)?;
        
        let accounts_iter = &mut accounts.iter();
        let account_to_write_on_chain = next_account_info(accounts_iter)?;

        // First four bytes will store the length of the data buffer
        let offset: usize = 4;
        let data_length = DataLength::try_from_slice(&account_to_write_on_chain.data.borrow()[..offset])?;

        match instruction {
            EchoInstruction::Add => {
                
                let s = match str::from_utf8(&instruction_data[1..]) {
                    Ok(v) => {
                        msg!("data buffer is {:?}", instruction_data);
                        msg!("in add with {}", v);
                        msg!("in add with length {}", v.len());
                        // We are putting a limit of 15 into the buffer
                        if v.len() > 15 {
                            return Err(ProgramError::InvalidInstructionData);
                        }

                        // We are also not allowing an AuthorizedEcho
                        // to be added to. An EchoMessage can be a max
                        // of 27 bytes:
                        // -- 8 for call_count
                        // -- 4 for String overhead
                        // -- 15 which is one for each character that includes padding
                        if data_length.length > SIZE_OF_NON_AUTH_ECHO_MESSAGE {
                            return Err(ProgramError::AccountAlreadyInitialized);
                        }
                        
                        let mut echo_message;
                        if data_length.length > 0 {
                            let length = usize::try_from(data_length.length).unwrap() + offset;
                            echo_message = EchoMessage::try_from_slice(&account_to_write_on_chain.data.borrow()[offset..length])?;
                        } else {
                            echo_message = EchoMessage {
                                call_count: 0,
                                message: String::from("Empty Buffer..."),
                            };
                        }
                        
                        let value_to_write = finalize_string_with_padding(v, 15, "0");

                        echo_message.message = value_to_write;
                        echo_message.call_count += 1;

                        // Message size is 4 plus one for each character
                        // Call count size is 8
                        let data_length = DataLength {
                            length: u32::try_from(get_instance_packed_len(&echo_message)?).unwrap(),
                        };

                        data_length.serialize(&mut &mut account_to_write_on_chain.data.borrow_mut()[..offset])?;
                        echo_message.serialize(&mut &mut account_to_write_on_chain.data.borrow_mut()[offset..])?;
                    },
                    Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
                };
            }, EchoInstruction::Delete => {
                msg!("in delete");
                // See if statement reasoning in "Add"
                if data_length.length > SIZE_OF_NON_AUTH_ECHO_MESSAGE {
                    return Err(ProgramError::AccountAlreadyInitialized);
                }
                
                let echo_message = EchoMessage {
                    call_count: 0,
                    message: String::from("Empty Buffer..."),
                 };

                 let data_length = DataLength {
                    length: u32::try_from(get_instance_packed_len(&echo_message)?).unwrap(),
                 };

                data_length.serialize(&mut &mut account_to_write_on_chain.data.borrow_mut()[..offset])?;
                echo_message.serialize(&mut &mut account_to_write_on_chain.data.borrow_mut()[offset..])?;
            }, EchoInstruction::InitializeAuthorizedEcho => {
                msg!("inside auth echo initialize");
                let fee_payer = next_account_info(accounts_iter)?;
                let authority = next_account_info(accounts_iter)?;
                
                // This is some seed given by the caller to add randomness
                // It is used in the future when writing to the program address
                let buffer_seed = instruction_data[1];
                msg!("buffer seed={}", buffer_seed);
                let (authorized_buffer_key, bump_seed) = Pubkey::find_program_address(
                    &[
                        b"authority",
                        fee_payer.key.as_ref(),
                        &buffer_seed.to_le_bytes()
                    ],
                    _program_id,
                );
                msg!("here we are");

                // Note that this authority key is derived and was done
                // so outside of this smart contract as well and passed
                // in as just a validation step to verify the person
                // that is initilizing this knows what htey are doing
                // This will be the same pattern used in AuthorizedEcho
                // when writing to the buffer finally
                msg!("auth buffer={}", authorized_buffer_key);
                msg!("auth key={}", *authority.key);
                assert_with_msg(
                    authorized_buffer_key == *authority.key,
                    ProgramError::InvalidArgument,
                    "Invalid PDA seeds for authority",
                )?;

                let echo_message = AuthorizedEchoMessage {
                    bump_seed: bump_seed,
                    buffer_seed: buffer_seed,
                    call_count: 0,
                    message: String::from("000000000000000"),                    
                };

                let data_length = DataLength {
                    length: u32::try_from(get_instance_packed_len(&echo_message)?).unwrap(),
                };

                data_length.serialize(&mut &mut account_to_write_on_chain.data.borrow_mut()[..offset])?;
                echo_message.serialize(&mut &mut account_to_write_on_chain.data.borrow_mut()[offset..])?;
            }, EchoInstruction::AuthorizedEcho => {
                let fee_payer = next_account_info(accounts_iter)?;
                let authority = next_account_info(accounts_iter)?;
                let final_byte_position = usize::try_from(data_length.length).unwrap() + offset;
                let mut echo_message = AuthorizedEchoMessage::try_from_slice(&account_to_write_on_chain.data.borrow()[offset..final_byte_position])?;
                msg!("saved seed is={}", echo_message.buffer_seed);
                let authority_seeds = &[
                    b"authority",
                    fee_payer.key.as_ref(), 
                    &[echo_message.buffer_seed], 
                    &[echo_message.bump_seed]
                ];
                msg!("here we are again1111");
                let auth_key = Pubkey::create_program_address(authority_seeds, _program_id)?;
                msg!("here we are again");
                assert_with_msg(
                    auth_key == *authority.key,
                    ProgramError::InvalidSeeds,
                    "Invalid PDA seeds for authority.",
                )?;

                let s = match str::from_utf8(&instruction_data[1..]) {
                    Ok(v) => {              
                        let value_to_write = finalize_string_with_padding(v, 15, "0");

                        echo_message.message = value_to_write;
                        echo_message.call_count += 1;

                        let new_data_length = DataLength {
                            length: u32::try_from(get_instance_packed_len(&echo_message)?).unwrap(),
                        };

                        new_data_length.serialize(&mut &mut account_to_write_on_chain.data.borrow_mut()[..offset])?;
                        echo_message.serialize(&mut &mut account_to_write_on_chain.data.borrow_mut()[offset..])?;
                    },
                    Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
                };
            }
        }
        Ok(())
    }


}