## Implemented
### Smart contract:
* Create Exchange Booth - As an admin create an exchange rate between two tokens
* Deposit to Excahnge Booth - As an admin, deposit into the vault of both Mints in the Exchange Booth. This is using PDA's. (Program Derived Addresses)
* Trade - As a customer exchange between Token A and B or between Token B and A

### UI:
* Simple react app that simply allows connection to the Phantom Wallet
* Executes against one of the smart contract actions to save a string and retrieve the string (localhost and devnet)
* Create token, mint, and also give to the current wallet

## TODO

* Split Rust code into separate files
* Refactor the smart contract code so there is less repeat code
* Reduce the amount of Accounts passed into the Deposit and Trade instructions since a lot was passed into Create
* Use the Echo Program I created to be the Oracle of what the exchange rate is
* Refactor the Type Script tests since there is a lot of repeat code
* Create basic web front end using React

## Open Questions
* How does decimal math work between mints? Solana is 9 decimals while serum is 6 decimals. I decided to only support exchange between mints of the same decimal value.
* Using the Regex cargo package in Rust ("regex", "1.5) results in the solana program not deploying. A barebones program costs 0.000965 SOL to deploy. However, initilaizing a basic Regex costs ~9.64876632 SOL. The .so file itself from the general smart contract file I have jumps from 405.728 KB to 1593.864 KB by adding one regex initialization.

## Two ways to run tests:

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