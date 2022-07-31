import './App.css';
import React from 'react';
// import * as anchor from "@project-serum/anchor";
import { useState } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import idl from './idl.json';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import {
  createMint,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  Account,
  transfer
} from "@solana/spl-token"; 
require('@solana/wallet-adapter-react-ui/styles.css');
// import {
//   Token,
//   TOKEN_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
// } from "@solana/spl-token";



const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  new PhantomWalletAdapter()
]

const { SystemProgram, Keypair } = web3;
/* create an account  */
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed"
}
// const programID = new PublicKey(idl.metadata.address);
const programID = new PublicKey("FS4tM81VusiHgaKe7Ar7X1fJesJCZho5CCWFELWcpckF");

class DisplaySomething extends React.Component {
  render() {
   return (
       <label>
         <p>{this.props.message}</p>
       </label>
   );
 }
}

function App() {
  const [value, setValue] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);
  const [toSave, setToSave] = useState(null);
  const wallet = useWallet();

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    // const network = "http://127.0.0.1:8899";
    // const connection = new Connection(network, opts.preflightCommitment);
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  async function createCounter() {    
    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    try {
      await program.rpc.initialize();
      await program.rpc.superSimple(toSave, {
        accounts: {
          dataLocation: baseAccount.publicKey,
          admin: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });

      const account = await program.account.superSimpleSave.fetch(baseAccount.publicKey);
      console.log('account: ', account);
      console.log("Call count in the smart contract:" + account.callCount.toString());
      console.log("What is stored in the smart contract:" + account.message.toString());

      setSavedMessage(account.message.toString());

      console.log('Anchor works')
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  async function createMintHenryk() {    
    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    
    console.log('create mint')

    // const network = "http://127.0.0.1:8899";
    const network = "https://api.devnet.solana.com/";
    // const connection = new Connection(network, opts.preflightCommitment);
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    const fromWallet = Keypair.generate();

    const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, 2*LAMPORTS_PER_SOL);
    // await connection.requestAirdrop(fromWallet.publicKey, 2*LAMPORTS_PER_SOL);
    // const fromAirdropSignature = await connection.requestAirdrop(provider.wallet.publicKey, 2*LAMPORTS_PER_SOL);
    const result = await connection.confirmTransaction(fromAirdropSignature);

    console.log("fromAirdropSignature="+fromAirdropSignature)
    console.log("result="+result)


    let mintA = await createMint(
      connection,
      fromWallet,
      fromWallet.publicKey,
      null,
      9, // 9 decimals
    );

    console.log(`Create token: ${mintA.toBase58()}`);

    let fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mintA,
      fromWallet.publicKey
    );
   
    console.log(`Create Token Account: ${fromTokenAccount.address.toBase58()}`);

    let tokenAccountInfo = await getAccount(connection, fromTokenAccount.address);
		console.log(tokenAccountInfo.amount);

    let signature = await mintTo(
      connection,
      fromWallet,
      mintA,
      fromTokenAccount.address,
      fromWallet.publicKey,
      100,
      [fromWallet]
    );

    tokenAccountInfo = await getAccount(connection, fromTokenAccount.address);
		console.log(tokenAccountInfo.amount);

    console.log(`Mint to signature: ${signature}`);

    let toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection, 
      fromWallet, 
      mintA, 
      provider.wallet.publicKey
    );

    console.log(`toTokenAccount ${toTokenAccount.address}`);


  let toTokenMintA_Info = await getAccount(connection, toTokenAccount.address);

  console.log("toTokenMintA_Info=" + toTokenMintA_Info.amount)
  signature = await transfer(
    connection,
    fromWallet,
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet.publicKey,
    10
  );



    console.log(`transfer: ${signature}`);

    toTokenMintA_Info = await getAccount(connection, toTokenAccount.address);
    console.log("toTokenMintA_Info=" + toTokenMintA_Info.amount)


    tokenAccountInfo = await getAccount(connection, fromTokenAccount.address);
		console.log("tokenAccountInfo=" + tokenAccountInfo.amount);
  }

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
  async function handleChange(e){
    setToSave(e.target.value);
    console.log('set to save = ' + e.target.value);
  }
  

  // async function increment() {
  //   const provider = await getProvider();
  //   const program = new Program(idl, programID, provider);
  //   // await program.rpc.increment({
  //   //   accounts: {
  //   //     baseAccount: baseAccount.publicKey
  //   //   }
  //   // });

  //   await program.rpc.initialize({
  //     accounts: {
  //       baseAccount: baseAccount.publicKey
  //     }
  //   });

  //   // const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  //   // console.log('account: ', account);
  //   // setValue(account.count.toString());
  //   console.log('hi there')
  // }

  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        
        <DisplaySomething message={savedMessage}></DisplaySomething>
        <div>
        <input type="text" name="messageToStore" onChange={handleChange}/>
          {
            !value && (<button onClick={createCounter}>Execute</button>)
          }
          {/* {
            value && <button onClick={increment}>Increment counter</button>
          } */}

          {
            value && value >= Number(0) ? (
              <h2>{value}</h2>
            ) : (
              <h3>
                <button onClick={createMintHenryk}>Create mint</button>
                
                Click the button to execute the smart contract
                </h3>
            )
          }
        </div>
      </div>
    );
  }
}

/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;