use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ZomeFnInput<T> {
    pub input: T,
    pub local: Option<bool>,
}

impl<T> ZomeFnInput<T> {
    pub fn new(input: T, local: Option<bool>) -> Self {
        Self { input, local }
    }

    pub fn get_strategy(&self) -> GetStrategy {
        let local = self.local.unwrap_or(true); // Default to local
        match local {
            true => GetStrategy::Local,
            false => GetStrategy::Network,
        }
    }

    pub fn get_options(&self) -> GetOptions {
        let local = self.local.unwrap_or(true); // Default to local
        match local {
            true => GetOptions::local(),
            false => GetOptions::network(),
        }
    }
}

impl<T> From<ZomeFnInput<T>> for GetStrategy {
    fn from(input: ZomeFnInput<T>) -> Self {
        input.get_strategy()
    }
}

impl<T> From<ZomeFnInput<T>> for GetOptions {
    fn from(input: ZomeFnInput<T>) -> Self {
        input.get_options()
    }
}
