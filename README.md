# Henryk's Solana repo

# Folders (Each one has a Read Me)

# booth_exchange
This folder contains code for the Exchange Booth Solana Bootcamp milestone project. This is the Youtube series: https://www.youtube.com/watch?v=O0uhZEfVPt8&list=PLilwLeBwGuK7Z2dXft_pmLZ675fuPgkA0&index=1

The project is built using the Anchor framework and Type Script. 

The project allows an admin to initilize the Exhcange Booth Smart Contract where someone is able to exchange two different tokens based on a set exchange rate.

# echo
This folder contains code for the following specifiction: https://github.com/henryksarat/solana/blob/main/echo/Echo_Program_Specification.pdf

This was part of the Solana Bootcamp that can be found here: https://www.youtube.com/watch?v=O0uhZEfVPt8&list=PLilwLeBwGuK7Z2dXft_pmLZ675fuPgkA0&index=1

It is written using plain rust with Borsch and a javascript runner. Not using Type Script or anchor
# rust_examples

Sample rust examples for myself while learning the language

# token_contract

A smart contract written as a wrapper around mint and transfer using Type Script and anchor.

# Helpful Solana commands

* Recover lost SOL from a deploy *

```
solana-keygen recover -o recover.json --force
solana program close recover.json
```

* Get around rate limit on devnet *

```
# make a new key
solana-keygen new -o localkey.json

# get public key
solana address -k localkey.json

# airdrop a bunch of SOL
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}
solana airdrop 2 {public_key}

# transfer from the key just made to the address locally
solana address -k /Users/{name}/.config/solana/id.json
solana transfer --from localkey.json {public_key} 18
