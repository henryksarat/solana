use std::fmt::Display;

// 1. Each paramter that has a reference gets its own lifetime paramter
// 2. If there is only one input lifetime paramter, that lifetime is assigned
//    to all output lifetime paramters
// 3. If there is multiple lifetime paramters, AND one is &self or &mut self,
//    the lifetime of self is assigned to all output paramters
fn longest_with_print<'a, T> (
    x: &'a str,
    y: &'a str,
    message: T,
) -> &'a str
where
    T: Display,
    {
        print!("Here is a message {}", message);
        if x.len() > y.len() {
            x
        } else {
            y
        }
    }

fn add_to_each_string<'a>(
    x: &'a str, 
    y: &'a str, 
    z: &'a str, 
    to_add: &str) -> (StringWrapperStruct<'a>, StringWrapperStruct<'a>, StringWrapperStruct<'a>) {
        let mut first = String::from(x);
        first.push_str(to_add);

        let mut second = String::from(y);
        second.push_str(to_add);

        let mut third = String::from(z);
        third.push_str(to_add);

        return (
            StringWrapperStruct::new(x, first),
            StringWrapperStruct::new(y, second),
            StringWrapperStruct::new(z, third),
        )
        // (
        //     StringWrapperStruct::new(x, &first), 
        //     StringWrapperStruct::new(y, &second), 
        //     StringWrapperStruct::new(z, &third)
        // )
    }

pub struct SimpleStruct {
    pub some_value: u8
}


impl SimpleStruct {
    pub fn new(
        some_value: u8,
    ) -> Self {
        Self {
            some_value
        }
    }
}

pub struct StringWrapperStruct<'a> {
    pub some_value: &'a str,
    pub with_extra_value: String
}


impl<'a> StringWrapperStruct<'a> {
    pub fn new(
        some_value: &'a str,
        with_extra_value: String,
    ) -> Self {
        Self {
            some_value,
            with_extra_value
        }
    }
}

pub struct LifeTimeCheck<'a> {
    pub some_value: &'a u8
}

impl<'a> LifeTimeCheck<'a> {
    pub fn new(
        some_value: &'a u8,
    ) -> Self {
        Self {
            some_value
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    pub fn create_new_life_time_check<'a>(example_value: &'a u8)-> LifeTimeCheck<'a> {
        return LifeTimeCheck::new(example_value);
    }

    pub fn create_new_simple_struct(example_value: u8)-> SimpleStruct {
        return SimpleStruct::new(example_value);
    }

    #[test]
    fn test_life_time_example_in_structs() {
        let value: u8 = 9;
        let life_time = create_new_life_time_check(&value);
        
        assert_eq!(*life_time.some_value, 9);

        let simple_struct = create_new_simple_struct(9);

        assert_eq!(simple_struct.some_value, 9);

    }

    #[test]
    fn test_longest() {
        let first = String::from("hi there");
        let second = String::from("bye");

        let result = longest_with_print(&first, &second, "Something else");
        
        assert_eq!(result, "hi there");
    }

    #[test]
    fn test_add_to_each_string() {
        let first = "this is one";
        let second = "this is two";
        let third = "this is three";
        let add_all = "add to all";

        let (result_one, result_two, result_three) = add_to_each_string(&first, &second, &third, &add_all);

        assert_eq!(result_one.some_value, first);
        assert_eq!(result_one.with_extra_value, String::from(first)+add_all);

        assert_eq!(result_two.some_value, second);
        assert_eq!(result_two.with_extra_value, String::from(second)+add_all);

        assert_eq!(result_three.some_value, third);
        assert_eq!(result_three.with_extra_value, String::from(third)+add_all);
    }
}