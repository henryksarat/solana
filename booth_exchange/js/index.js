//Making this runner didnt work

// // const { readFile } = require("mz/fs");
// const {
//   Connection,
//   sendAndConfirmTransaction,
//   Keypair,
//   Transaction,
//   SystemProgram,
//   PublicKey,
//   TransactionInstruction,
// } = require("@solana/web3.js");

// const {Program, Provider} = require("@project-serum/anchor")

// const { web3, AnchorProvider } = require("@project-serum/anchor")

// const idl = JSON.parse(
//     require("fs").readFileSync('../target/idl/booth_exchange.json')
// )

// // const {idl} = '../target/idl/booth_exchange.json'

// const main = async () => {
//     const counter = new Keypair();
//     let counterKey = counter.publicKey;

//     // const wallet = window.solana
//     // const network = clusterApiUrl("devnet")
//     // const network = "http://127.0.0.1:8899"
//     // const connection = new Connection(network, opts.preflightCommitment);

//     // const provider = new Provider(
//     //   connection, wallet, opts.preflightCommitment,
//     // )



//     // const programId = new PublicKey("FS4tM81VusiHgaKe7Ar7X1fJesJCZho5CCWFELWcpckF")

//     const programId = new PublicKey("FS4tM81VusiHgaKe7Ar7X1fJesJCZho5CCWFELWcpckF")

//     // const program = new Program(idl, programId)

//     // console.log(idl)

//     const connection = new Connection("https://api.devnet.solana.com/", 'finalized');
//     let feePayer = new Keypair();

    
//     // await program.rpc.initialize()
    
//     await connection.requestAirdrop(feePayer.publicKey, 2e9);

//     let signers = [feePayer];
//     const tweet = web3.Keypair.generate()
// //     console.log(tweet.publicKey)

//     let tx = new Transaction();
//     // var data = Buffer.from(new Uint8Array([0]));
//     var data = Buffer.alloc(8)
//   let incrIx = new TransactionInstruction({
//     keys: [
//       {
//         pubkey: counterKey,
//         isSigner: false,
//         isWritable: true,
//       }
//     ],
//     programId: programId,
//     data: data,
//   });

//   tx.add(incrIx);

//   let txid = await sendAndConfirmTransaction(connection, tx, signers, {
//     skipPreflight: true,
//     preflightCommitment: "confirmed",
//     confirmation: "confirmed",
//   });
// }

// main()
//   .then(() => {
//     console.log("Success");
//   })
//   .catch((e) => {
//     console.error(e);
//   });
