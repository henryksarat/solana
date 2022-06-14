use std::mem;
use solana_program::{
    borsh::get_instance_packed_len,
    msg
};

pub fn finalize_string_with_padding(
    initial_string: &str, 
    padding_length: usize, 
    padding_char: &str) -> String {
    
    let mut value_to_write = String::from(initial_string);
                    
    if value_to_write.len() < padding_length {
        let padding = padding_length-initial_string.len();
        for _i in 0..padding {
            value_to_write.push_str(padding_char);
        }
    } else {
        value_to_write = String::from(&initial_string[0..padding_length]);
    }

    return value_to_write;
}

pub fn copy_and_truncate(target_array: &mut Vec<u8>, array_to_copy: Vec<u8>, preserve_slots_in_target: usize) {
    for i in 0..array_to_copy.len() {
        target_array[i+preserve_slots_in_target] = array_to_copy[i];
    }

    if let Some(i) = target_array.iter().rposition(|x| *x != 0) {
        let new_len = i + 1;
        target_array.truncate(new_len);
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_copy_and_truncate_empty_target_array() {
        let mut instruction_data: Vec<u8> = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        let arr = String::into_bytes(String::from("12345"));

        copy_and_truncate(&mut instruction_data, arr, 0);

        let expected_bytes = String::into_bytes(String::from("12345"));
        
        assert_eq!(instruction_data.len(), expected_bytes.len());
        assert_eq!(instruction_data, expected_bytes);
    }

    #[test]
    fn test_copy_and_truncate_with_items_in_target_array() {
        let mut instruction_data: Vec<u8> = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        instruction_data[0] = 5;

        let arr = String::into_bytes(String::from("12345"));

        copy_and_truncate(&mut instruction_data, arr, 1);

        let expected_bytes = String::into_bytes(String::from("12345"));
        let final_expected = [
            5, 
            expected_bytes[0],
            expected_bytes[1],
            expected_bytes[2],
            expected_bytes[3],
            expected_bytes[4]
        ];

        assert_eq!(instruction_data.len(), final_expected.len());
        assert_eq!(instruction_data, final_expected);
    }

    #[test]
    fn test_copy_and_truncate_with_two_items_in_target_array_and_larger_copy_from_array() {
        let mut instruction_data: Vec<u8> = vec![0; mem::size_of::<u8>()+ mem::size_of::<u8>()+mem::size_of::<String>()];
        instruction_data[0] = 3;
        instruction_data[1] = 100;

        let arr = String::into_bytes(String::from("USDEUR:0.96"));

        copy_and_truncate(&mut instruction_data, arr, 2);

        let expected_bytes = String::into_bytes(String::from("USDEUR:0.96"));
        let final_expected = [
            3, 
            100, 
            expected_bytes[0],
            expected_bytes[1],
            expected_bytes[2],
            expected_bytes[3],
            expected_bytes[4],
            expected_bytes[5],
            expected_bytes[6],
            expected_bytes[7],
            expected_bytes[8],
            expected_bytes[9],
            expected_bytes[10]
        ];

        assert_eq!(instruction_data.len(), final_expected.len());
        assert_eq!(instruction_data, final_expected);
    }

    #[test]
    fn test_finalize_string_with_padding() {
        let initial = "12";

        let result = finalize_string_with_padding(&initial, 5, "0");

        assert_eq!(result, "12000");
    }

    #[test]
    fn test_finalize_string_with_padding_but_right_before_length() {
        let initial = "1234";

        let result = finalize_string_with_padding(&initial, 5, "0");

        assert_eq!(result, "12340");
    }

    #[test]
    fn test_finalize_string_with_padding_but_right_at_length() {
        let initial = "12345";

        let result = finalize_string_with_padding(&initial, 5, "0");

        assert_eq!(result, "12345");
    }

    #[test]
    fn test_finalize_string_with_padding_but_go_over() {
        let initial = "123456";

        let result = finalize_string_with_padding(&initial, 5, "0");

        assert_eq!(result, "12345");
    }

    #[test]
    fn test_finalize_string_with_padding_with_no_padding() {
        let initial = "123456";

        let result = finalize_string_with_padding(&initial, 0, "0");

        assert_eq!(result, "");
    }

    #[test]
    fn test_finalize_string_with_padding_with_lots_of_padding() {
        let initial = "1";

        let result = finalize_string_with_padding(&initial, 20, "a");

        assert_eq!(result, "1aaaaaaaaaaaaaaaaaaa");
    }
}
