# Henryk's Solana repo

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
cd into any of the directories with the Cargo.toml file and run the command test command, example:
```
cd echo/program
cargo test-bpf --manifest-path=./Cargo.toml
```

### Dev loop

```
solana config set --url devnet
cd echo/program
cargo test-bpf --manifest-path=./Cargo.toml
cd ~/solana/echo/program
cargo build-bpf

The above command will output a command after the text "To deploy this program:". Copy and paste this.
A PROGRAM ID for the "Execute JS" section below will be printed to the scren.
```

### Execute JS

Execution number:
0 - Echo message without auth
1 - Clear out echo message
2 - Initilize echo message with specified auth
3 - Update echo message with the auth that was initilized

```
cd js
solana-keygen new -o newkeynow
node index.js ${program_id from deployment} ${execution_number} #{writable_address} #{secret_key_file_name}

# example:
# initialize Auth Echo
node index.js gRnNX6fUiJV2pXcyNVnZj7eAmEps2CJUcsyq6uzWYts 2 newkeynow
# get the writable address to now use
node index.js gRnNX6fUiJV2pXcyNVnZj7eAmEps2CJUcsyq6uzWYts 3 newkeynow AdTE6qDsRNCP8QqfkPhiT3rGCjno5ZjQ7C4vgyZ1fw4Y
```