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


