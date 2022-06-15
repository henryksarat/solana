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
solana config set --url devnet
cd ~/solana/echo
cargo test-bpf --manifest-path=./program/Cargo.toml
cd ~/solana/echo/program
cargo build-bpf
whatever the output is to deploy and save this PROGRAM ID for the "Execute JS" section below

### Execute JS
cd js
solana-keygen new -o newkeynow
node index.js ${program_id from deployment} ${execution_numer} #{writable_address} #{secret_key_file_name}

# example:
# initialize Auth Echo
node index.js gRnNX6fUiJV2pXcyNVnZj7eAmEps2CJUcsyq6uzWYts 2 newkeynow
# get the writable address to now use
node index.js gRnNX6fUiJV2pXcyNVnZj7eAmEps2CJUcsyq6uzWYts 3 newkeynow AdTE6qDsRNCP8QqfkPhiT3rGCjno5ZjQ7C4vgyZ1fw4Y