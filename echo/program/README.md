### Environment Setup
1. Install Rust from https://rustup.rs/
2. Install Solana from https://docs.solana.com/cli/install-solana-cli-tools#use-solanas-install-tool

### Build and test for program compiled natively
```
$ cargo build
$ cargo test
```

### Build and test the program compiled for BPF
```
$ cargo build-bpf
$ cargo test-bpf
```

### Run unit tests
```
cargo test-bpf --manifest-path=./counter/Cargo.toml
```

### Dev loop
cd ~/solana-bootcamp-lectures/echo/counter
cargo build-bpf
solana program deploy /Users/henryksarat/Documents/Coding/solana/solana-bootcamp-lectures/echo/counter/target/deploy/counter.so
