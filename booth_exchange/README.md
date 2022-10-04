## Implemented

### Smart contract:
* Create Exchange Booth - As an admin create an exchange rate between two tokens
* Deposit to Excahnge Booth - As an admin, deposit into the vault of both Mints in the Exchange Booth. This is using PDA's. (Program Derived Addresses)
* Swap - As a customer exchange between Token A and B or between Token B and A

### UI:

![Exchange Booth](https://github.com/henryksarat/solana/blob/main/images/exchange_booth_vault_home.png)

- Simple react app that allows connection to the Phantom Wallet
- Functions: 
    - Mint token
    - Add mint to a brand new account
    - Create the exchange booth
    - Deposit to the vaults for the Exchange Booth
    - Execute swap

## TODO

* Split Rust code into separate files
* Refactor the smart contract code so there is less repeat code
* Reduce the amount of Accounts passed into the Deposit and Trade instructions since a lot was passed into Create
* Use the Echo Program I created to be the Oracle of what the exchange rate is

## Open Questions
* How does decimal math work between mints? Solana is 9 decimals while serum is 6 decimals. I decided to only support exchange between mints of the same decimal value.

## Two ways to run smart contract and integration tests:

Option 1:
```
Terminal 1:
solana config set --url localhost
solana-test-validator --no-bpf-jit --reset

Terminal 2:
anchor test --skip-local-validator

[Optional] Terminal 3 for logs:
solana logs --url localhost
```

Option 2:

```
cargo test-bpf --manifest-path=./Cargo.toml
anchor test
```

## To run UI tests
In the frontend/app directory run
```
npm test
```

## Build and copy idl
This assumest that this is checked out in /Users/{username}/Documents/Coding/ and in the solana/booth_exchange directory. Replace {username} with your account
```
anchor build; solana program deploy /Users/{username}/Documents/Coding/solana/solana/booth_exchange/target/deploy/booth_exchange.so; cp target/idl/booth_exchange.json frontend/app/src/idl.json
```