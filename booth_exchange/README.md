Two ways to run tests:

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
anchor test
```


##Good references
https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor

Github request that caused change that removed setting a bump which caused a lot of confusion for me, but it let me to a good tutorial
https://github.com/coral-xyz/anchor/pull/1380 

Change log of anchor since there may be breaking changes
https://github.com/coral-xyz/anchor/blob/master/CHANGELOG.md

https://github.com/clague17/sol-bootcamp-exchange/blob/main/program/src/processor/initialize_exchange_booth.rs