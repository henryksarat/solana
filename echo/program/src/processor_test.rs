use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    borsh::get_instance_packed_len,
};

use crate::padder::copy_and_truncate;
use crate::instruction::EchoInstruction;
use crate::state::EchoMessage;
use crate::state::DataLength;
use crate::state::AuthorizedEchoMessage;
use std::str;

use crate::processor::Processor;



// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;

    #[test]
    fn test_echo_program_simple_happy_path() {
        let max_buffer_of_text_for_the_test = String::into_bytes(String::from("Empty Buffer..."));
        let arr = String::into_bytes(String::from("hi there"));
        
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<u64>()+mem::size_of::<u64>()+(max_buffer_of_text_for_the_test.len())];
        
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );

        let mut instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];

        copy_and_truncate(&mut instruction_data, arr, 1);

        let accounts = vec![account];
        
        assert_eq!(0, 0);

        Processor::process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        let mut length = u32::from_le_bytes(accounts[0].data.borrow()[0..4].try_into().unwrap()) as usize;
        assert_eq!(
            EchoMessage::try_from_slice(&accounts[0].data.borrow()[4..(length+4)])
                .unwrap()
                .call_count,
            1
        );

        assert_eq!(
            EchoMessage::try_from_slice(&accounts[0].data.borrow()[4..(length+4)])
                .unwrap()
                .message,
            "hi there0000000"
        );

        Processor::process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        assert_eq!(
            EchoMessage::try_from_slice(&accounts[0].data.borrow()[4..(length+4)])
                .unwrap()
                .call_count,
            2
        );

        assert_eq!(
            EchoMessage::try_from_slice(&accounts[0].data.borrow()[4..(length+4)])
                .unwrap()
                .message,
            "hi there0000000"
        );

        let instruction_data_two = vec![1];

        Processor::process_instruction(&program_id, &accounts, &instruction_data_two).unwrap();
        length = u32::from_le_bytes(accounts[0].data.borrow()[0..4].try_into().unwrap()) as usize;

        assert_eq!(
            EchoMessage::try_from_slice(&accounts[0].data.borrow()[4..(length+4)])
                .unwrap()
                .call_count,
            0
        );

        assert_eq!(
            EchoMessage::try_from_slice(&accounts[0].data.borrow()[4..(length+4)])
                .unwrap()
                .message,
            "Empty Buffer..."
        );

        // assert_eq!(false, true);
    }

    #[test]
    fn test_echo_program_too_long() {
        let arr = String::into_bytes(String::from("LONG STRING00000"));

        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<u64>()+mem::size_of::<u64>()+(arr.len())];
        
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );

        let mut instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];

        copy_and_truncate(&mut instruction_data, arr, 1);

        let accounts = vec![account];
        
        assert_eq!(0, 0);

        let result = Processor::process_instruction(&program_id, &accounts, &instruction_data).map_err(|e| e);
        
        let expected = Err(ProgramError::InvalidInstructionData);
        assert_eq!(expected, result);

    }

    #[test]
    fn test_echo_program_initialize_auth_echo() {
        let arr = String::into_bytes(String::from("000000000000000"));

        let program_id = Pubkey::default();

        let writable_account_key = Pubkey::default();
        let owner_key = Pubkey::default();
        
        let mut lamports_main_writable_account = 0;
        let mut lamports_owner = 0;

        // We add the length of the buffer that will store the length of the data
        let mut data_writable_account = vec![
            0; 
            mem::size_of::<u64>()+
            mem::size_of::<u8>()+
            mem::size_of::<u8>()+
            mem::size_of::<u64>()+
            (arr.len())
        ];

        // We remove the length of the buffer to just know the data portion size
        let expected_length_of_data_only = data_writable_account.len() - 4;

        let mut data_main_owner = vec![0];
        
        let mut lamports_authority_account = 0;
        let mut data_athority_account = vec![0];

        let seed = &[67];
        
        let mut instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        instruction_data[0] = 2;
        instruction_data[1] = seed[0];

        let (authority_key, _) = Pubkey::find_program_address(
            &[
                b"authority",
                owner_key.as_ref(), 
                seed
            ],
            &program_id,
        );

        let (owner_account, account_main_writable, account_authority) = create_and_return_three_account_infos(
            &owner_key, 
            &mut lamports_owner, 
            &mut data_main_owner,
            &writable_account_key,
            &mut lamports_main_writable_account,
            &mut data_writable_account,
            &authority_key,
            &mut lamports_authority_account,
            &mut data_athority_account,
        );

        let accounts = vec![
            account_main_writable, 
            owner_account, 
            account_authority
        ];
        
        Processor::process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        let length = u32::from_le_bytes(accounts[0].data.borrow()[0..4].try_into().unwrap()) as usize;
        
        assert_eq!(length, expected_length_of_data_only);

        let length_of_data_ending_after_offset_added = length + 4;

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .call_count,
            0
        );

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .message,
            "000000000000000"
        );
    }

    #[test]
    fn test_echo_program_initialize_auth_echo_pda_seed_error() {
        let arr = String::into_bytes(String::from("000000000000000"));

        let program_id = Pubkey::default();

        let writable_account_key = Pubkey::default();
        let owner_key = Pubkey::default();
        
        let mut lamports_main_writable_account = 0;
        let mut lamports_owner = 0;

        let mut data_writable_account = vec![
            0; 
            mem::size_of::<u64>()+
            mem::size_of::<u8>()+
            mem::size_of::<u8>()+
            mem::size_of::<u64>()+
            (arr.len())
        ];
        let mut data_main_owner = vec![0];
        
        let mut lamports_authority_account = 0;
        let mut data_athority_account = vec![0];

        let seed = &[67];
        
        let mut instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        instruction_data[0] = 2;
        instruction_data[1] = seed[0];

        let (authority_key, _) = Pubkey::find_program_address(
            &[
                b"authority",
                owner_key.as_ref(), 
                &[68]
            ],
            &program_id,
        );

        let (owner_account, account_main_writable, account_authority) = create_and_return_three_account_infos(
            &owner_key, 
            &mut lamports_owner, 
            &mut data_main_owner,
            &writable_account_key,
            &mut lamports_main_writable_account,
            &mut data_writable_account,
            &authority_key,
            &mut lamports_authority_account,
            &mut data_athority_account,
        );

        let accounts = vec![
            account_main_writable, 
            owner_account, 
            account_authority
        ];
        
        let result = Processor::process_instruction(&program_id, &accounts, &instruction_data);
        let expected = Err(ProgramError::InvalidArgument);
        assert_eq!(expected, result);

        let length = u32::from_le_bytes(accounts[0].data.borrow()[0..4].try_into().unwrap()) as usize;
        
        assert_eq!(length, 0);
    }

    #[test]
    fn test_echo_program_initialize_auth_echo_and_update_multiple_times() {
        let mut arr = String::into_bytes(String::from("000000000000000"));

        let program_id = Pubkey::default();

        let writable_account_key = Pubkey::default();
        let owner_key = Pubkey::default();
        
        let mut lamports_main_writable_account = 0;
        let mut lamports_owner = 0;

        // We add the length of the buffer that will store the length of the data
        let mut data_writable_account = vec![
            0; 
            mem::size_of::<u64>()+
            mem::size_of::<u8>()+
            mem::size_of::<u8>()+
            mem::size_of::<u64>()+
            (arr.len())
        ];

        // We remove the length of the buffer to just know the data portion size
        let expected_length_of_data_only = data_writable_account.len() - 4;

        let mut data_main_owner = vec![0];
        
        let mut lamports_authority_account = 0;
        let mut data_athority_account = vec![0];

        let seed = &[100];
        
        let mut instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        instruction_data[0] = 2;
        instruction_data[1] = seed[0];

        let (authority_key, _) = Pubkey::find_program_address(
            &[
                b"authority",
                owner_key.as_ref(), 
                seed
            ],
            &program_id,
        );

        let (owner_account, account_main_writable, account_authority) = create_and_return_three_account_infos(
            &owner_key, 
            &mut lamports_owner, 
            &mut data_main_owner,
            &writable_account_key,
            &mut lamports_main_writable_account,
            &mut data_writable_account,
            &authority_key,
            &mut lamports_authority_account,
            &mut data_athority_account,
        );

        let accounts = vec![
            account_main_writable, 
            owner_account, 
            account_authority
        ];
        
        Processor::process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        let length = u32::from_le_bytes(accounts[0].data.borrow()[0..4].try_into().unwrap()) as usize;
        
        assert_eq!(length, expected_length_of_data_only);

        let length_of_data_ending_after_offset_added = length + 4;
        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .call_count,
            0
        );

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .message,
            "000000000000000"
        );

        arr = String::into_bytes(String::from("USDEUR:0.96"));

        let mut new_instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        new_instruction_data[0] = 3;

        copy_and_truncate(&mut new_instruction_data, arr, 1);
        
        Processor::process_instruction(&program_id, &accounts, &new_instruction_data).unwrap();

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .call_count,
            1
        );

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .message,
            "USDEUR:0.960000"
        );


        arr = String::into_bytes(String::from("SOME LONG STRING"));

        new_instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        new_instruction_data[0] = 3;

        copy_and_truncate(&mut new_instruction_data, arr, 1);
        
        Processor::process_instruction(&program_id, &accounts, &new_instruction_data).unwrap();

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .call_count,
            2
        );

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .message,
            "SOME LONG STRIN"
        );
    }

    #[test]
    fn test_echo_program_initialize_auth_echo_and_fail_to_update_with_different_auth() {
        let mut arr = String::into_bytes(String::from("000000000000000"));

        let program_id = Pubkey::default();

        let writable_account_key = Pubkey::default();
        let owner_key = Pubkey::default();
        
        let mut lamports_main_writable_account = 0;
        let mut lamports_owner = 0;

        // We add the length of the buffer that will store the length of the data
        let mut data_writable_account = vec![
            0; 
            mem::size_of::<u64>()+
            mem::size_of::<u8>()+
            mem::size_of::<u8>()+
            mem::size_of::<u64>()+
            (arr.len())
        ];

        // We remove the length of the buffer to just know the data portion size
        let expected_length_of_data_only = data_writable_account.len() - 4;

        let mut data_main_owner = vec![0];
        
        let mut lamports_authority_account = 0;
        let mut data_athority_account = vec![0];

        let seed = &[100];
        
        let mut instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        instruction_data[0] = 2;
        instruction_data[1] = seed[0];

        let (authority_key, _) = Pubkey::find_program_address(
            &[
                b"authority",
                owner_key.as_ref(), 
                seed
            ],
            &program_id,
        );

        let (owner_account, account_main_writable, account_authority) = create_and_return_three_account_infos(
            &owner_key, 
            &mut lamports_owner, 
            &mut data_main_owner,
            &writable_account_key,
            &mut lamports_main_writable_account,
            &mut data_writable_account,
            &authority_key,
            &mut lamports_authority_account,
            &mut data_athority_account,
        );

        let mut accounts = vec![
            account_main_writable, 
            owner_account, 
            account_authority
        ];
        
        Processor::process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        let length = u32::from_le_bytes(accounts[0].data.borrow()[0..4].try_into().unwrap()) as usize;
        
        assert_eq!(length, expected_length_of_data_only);

        let length_of_data_ending_after_offset_added = length + 4;
        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .call_count,
            0
        );

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .message,
            "000000000000000"
        );

        arr = String::into_bytes(String::from("USDEUR:0.96"));

        let mut new_instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        new_instruction_data[0] = 3;

        copy_and_truncate(&mut new_instruction_data, arr, 1);
        
        let new_owner_key_of_someone_else = Pubkey::new_from_array(
            [
                1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
                0, 0, 0, 0, 0, 0, 0, 0
            ]
        );

        let mut new_lamports = 0;
        let mut new_data_authority_account = vec![0];
        let new_owner_account = AccountInfo::new(
            &new_owner_key_of_someone_else,
            true,
            false,
            &mut new_lamports,
            &mut new_data_authority_account,
            &new_owner_key_of_someone_else,
            false,
            Epoch::default(),
        );

        accounts[1] = new_owner_account;

        let result = Processor::process_instruction(&program_id, &accounts, &new_instruction_data);

        let expected = Err(ProgramError::InvalidSeeds);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_auth_echo_program_initialize_then_verify_regular_echo_functions_fail() {
        let mut arr = String::into_bytes(String::from("000000000000000"));

        let program_id = Pubkey::default();

        let writable_account_key = Pubkey::default();
        let owner_key = Pubkey::default();
        
        let mut lamports_main_writable_account = 0;
        let mut lamports_owner = 0;

        // We add the length of the buffer that will store the length of the data
        let mut data_writable_account = vec![
            0; 
            mem::size_of::<u64>()+
            mem::size_of::<u8>()+
            mem::size_of::<u8>()+
            mem::size_of::<u64>()+
            (arr.len())
        ];

        // We remove the length of the buffer to just know the data portion size
        let expected_length_of_data_only = data_writable_account.len() - 4;

        let mut data_main_owner = vec![0];
        
        let mut lamports_authority_account = 0;
        let mut data_athority_account = vec![0];

        let seed = &[100];
        
        let mut instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        instruction_data[0] = 2;
        instruction_data[1] = seed[0];

        let (authority_key, _) = Pubkey::find_program_address(
            &[
                b"authority",
                owner_key.as_ref(), 
                seed
            ],
            &program_id,
        );

        let (owner_account, account_main_writable, account_authority) = create_and_return_three_account_infos(
            &owner_key, 
            &mut lamports_owner, 
            &mut data_main_owner,
            &writable_account_key,
            &mut lamports_main_writable_account,
            &mut data_writable_account,
            &authority_key,
            &mut lamports_authority_account,
            &mut data_athority_account,
        );

        let mut accounts = vec![
            account_main_writable, 
            owner_account, 
            account_authority
        ];
        
        Processor::process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        let length = u32::from_le_bytes(accounts[0].data.borrow()[0..4].try_into().unwrap()) as usize;
        
        assert_eq!(length, expected_length_of_data_only);

        let length_of_data_ending_after_offset_added = length + 4;
        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .call_count,
            0
        );

        assert_eq!(
            AuthorizedEchoMessage::try_from_slice(
                &accounts[0].data.borrow()[4..length_of_data_ending_after_offset_added])
                .unwrap()
                .message,
            "000000000000000"
        );

        arr = String::into_bytes(String::from("USDEUR:0.960000"));

        let mut new_instruction_data = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        new_instruction_data[0] = 0;

        copy_and_truncate(&mut new_instruction_data, arr, 1);
        
        let result = Processor::process_instruction(&program_id, &accounts, &new_instruction_data);
        let expected = Err(ProgramError::AccountAlreadyInitialized);
        assert_eq!(result, expected);

        new_instruction_data[0] = 1;

        let result_delete = Processor::process_instruction(&program_id, &accounts, &new_instruction_data);
        assert_eq!(result_delete, expected);
    }

    fn create_and_return_three_account_infos<'a> (
        owner_key: &'a Pubkey,
        lamports_owner: &'a mut u64,
        data_main_owner: &'a mut [u8],
        writable_account_key: &'a Pubkey,
        lamports_main_writable_account: &'a mut u64,
        data_writable_account: &'a mut [u8],
        authority_key: &'a Pubkey,
        lamports_authority_account: &'a mut u64,
        data_athority_account: &'a mut [u8]
    ) -> (AccountInfo<'a>, AccountInfo<'a>, AccountInfo<'a>) {
        let owner_account = AccountInfo::new(
            owner_key,
            true,
            false,
            lamports_owner,
            data_main_owner,
            owner_key,
            false,
            Epoch::default(),
        );

        let account_main_writable = AccountInfo::new(
            writable_account_key,
            false,
            true,
            lamports_main_writable_account,
            data_writable_account,
            &owner_key,
            false,
            Epoch::default(),
        );

        let account_authority = AccountInfo::new(
            &authority_key,
            false,
            true,
            lamports_authority_account,
            data_athority_account,
            &owner_key,
            false,
            Epoch::default(),
        );

        return (owner_account, account_main_writable, account_authority);
    }
}

