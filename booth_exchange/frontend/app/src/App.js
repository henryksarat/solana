import * as anchor from "@project-serum/anchor";
import './App.css';
import React from 'react';
// import * as anchor from "@project-serum/anchor";
import { useState } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';

import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import idl from './idl.json';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import Table from 'react-bootstrap/Table';

import {
  createMint,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  transfer,
} from "@solana/spl-token"; 
require('@solana/wallet-adapter-react-ui/styles.css');

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
const programID = new PublicKey("BR6rCBaWFS1DS3U9MirWBFDjJ2NEBWgrPGTkLCCrgju8");

class DisplaySomething extends React.Component {
  render() {
   return (
       <label>
         <p>{this.props.message}</p>
       </label>
   );
 }
}

class DisplayMintInformation extends React.Component {
  render() {
      console.log(this.props.mint_info)
    
      if(this.props.mint_info == null) {
        return ( 
          <label>
            No mint created yet 
        </label>
        )
      }
    
      var rows = []
  
      var total_amount = 0
      for(let i = 0; i < this.props.mint_info.length ; i++) {
        rows.push(
          <tr key={i}>
            <td>{i}</td>
            <td>{this.props.mint_info[i].mint.toBase58()}</td>
            <td>{this.props.mint_info[i].admin.publicKey.toBase58()}</td>
            <td>{this.props.mint_info[i].admin_token_account_address.address.toBase58()}</td>
            <td>{this.props.mint_info[i].amount_minted}</td>
          </tr>
          )
      }

   return (
          <Table striped bordered hover size="sm">
          <thead>
              <tr>
                <th>index</th>
                <th>Mint</th>
                <th>Admin Public Key</th>
                <th>ATA</th>
                <th>Minted Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
            
          </Table>
   );
 }
}


class DisplayVaultInformation extends React.Component {
  render() {    
      console.log("here")
      if(this.props.vault_info == null) {
        return ( 
          <label>
            No vaults created yet
        </label>
        )
      }
    
      var rows = []
      console.log("here1")
      var total_amount = 0
      for(let i = 0; i < this.props.vault_info.length ; i++) {
        console.log("here2")
        console.log(this.props.vault_info[i].mint.toBase58())
        rows.push(
          <tr key={i}>
            <td>{i}</td>
            <td>{this.props.vault_info[i].mint.toBase58()}</td>
            <td>{this.props.vault_info[i].ata.address.toBase58()}</td>
          </tr>
          )
      }

   return (
          <Table striped bordered hover size="sm">
          <thead>
              <tr>
                <th>index</th>
                <th>Mint</th>
                <th>ATA</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
            
          </Table>
   );
 }
}

function App() {
  const [value, setValue] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);
  const [toSave, setToSave] = useState(null);
  const [toMintInformation, setToMintInformation] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [toSetToMintAmount, setToMintAmount] = useState(null);
  const [exchangeBoothVaults, setExchangeBoothVaults] = useState(null);

  const wallet = useWallet();
// tried to create mint on devnet and didnt work
// doing devnet since on localhost I cant do simple save wint a mint a
  async function getProvider() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    // const network = "http://127.0.0.1:8899";
    // const connection = new Connection(network, opts.preflightCommitment);

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
      console.log('start initialize')
      await program.rpc.initialize();
      console.log('after initialize')
      console.log('start super simple')
      let result = await program.rpc.superSimple(toSave, {
        accounts: {
          dataLocation: baseAccount.publicKey,
          admin: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          mintA: exchangeBoothVaults[0].mint,
          rent: SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        signers: [baseAccount]
      });
      console.log("baseAccount.publicKey=" + baseAccount.publicKey.toBase58())
      console.log('end super simple')
      console.log("result=" +JSON.stringify(result))
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

  async function createExchangeBooth() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    
    console.log("program_id=" +programID)

    if (exchangeBoothVaults == null || exchangeBoothVaults.length != 2) {
      console.log('not enough mints')
      return
    }

    console.log(exchangeBoothVaults[0].mint.toBuffer())
    let [adminPdaKey, _adminPdaBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("ebpda"),
        exchangeBoothVaults[0].mint.toBuffer(),
        exchangeBoothVaults[1].mint.toBuffer(),
      ],
      programID
    ));

    let [vaultAPDAKey, _] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultA"),
        exchangeBoothVaults[0].mint.toBuffer(),
      ],
      programID
    ));

    let [vaultBPDAKey, s] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultB"),
        exchangeBoothVaults[1].mint.toBuffer(),
      ],
      programID
    ));
    
    console.log("adminPdaKey=" + adminPdaKey.toBase58())

    let result = await program.rpc.create("1:2", "0.2", {
      accounts: {
        payer: provider.wallet.publicKey,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        mintA: exchangeBoothVaults[0].mint,
        mintB: exchangeBoothVaults[1].mint,
        dataLocation: adminPdaKey,
        vaultAPdaKey: vaultAPDAKey,
        vaultBPdaKey: vaultBPDAKey,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID
      },
    });

    console.log("result = " + JSON.stringify(result))
    console.log("program_id="+programID)
    console.log("pda key="+adminPdaKey)
  }

  async function createMintHenryk() {    
    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    
    console.log('create mint')
    console.log('baseAccount=' + baseAccount.publicKey.toBase58())

    const connection = provider.connection;

    const fromWallet = Keypair.generate();

    const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, 2*LAMPORTS_PER_SOL);
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
      toSetToMintAmount,
      [fromWallet]
    );

    tokenAccountInfo = await getAccount(connection, fromTokenAccount.address);
		
    const originalMintAmount = String(tokenAccountInfo.amount)

    console.log(originalMintAmount);

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
    if(toMintInformation == undefined) {
      setToMintInformation([
        {
          'mint': mintA,
          'admin': fromWallet,
          'admin_token_account_address': fromTokenAccount,
          'amount_minted': originalMintAmount
        }
      ])


      setExchangeBoothVaults(
        [
          {
            'mint': mintA,
            'ata': toTokenAccount
          }
        ]
      )

      console.log('original amount=' + originalMintAmount)
      console.log('first')
    } else {
      let newItems = toMintInformation;
      newItems.push(
        {
          'mint': mintA,
          'admin': fromWallet,
          'admin_token_account_address': fromTokenAccount,
          'amount_minted': originalMintAmount
        }
      )
      setToMintInformation(newItems)


      let newItemsVault = exchangeBoothVaults;


      newItemsVault.push(
          {
            'mint': mintA,
            'ata': toTokenAccount
          }
      )

      setExchangeBoothVaults(newItemsVault)
      console.log('original amount=' + originalMintAmount)
      console.log('added more')
    }

    if (refresh) {
      setRefresh(false)
    } else {
      setRefresh(true)
    }
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

  async function handleChangeMintAmount(e){
    setToMintAmount(e.target.value);
    console.log('set to mint = ' + e.target.value);
  }

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
            !value && (<Button onClick={createCounter}>Execute</Button>)
          }
          {/* {
            value && <button onClick={increment}>Increment counter</button>
          } */}

          {
            value && value >= Number(0) ? (
              <h2>{value}</h2>
            ) : (
              <h3>
                <div>
                  <DisplayMintInformation mint_info={toMintInformation}></DisplayMintInformation>
                  <DisplayVaultInformation vault_info={exchangeBoothVaults}></DisplayVaultInformation>
                </div>
                <div>
                Total to Mint
                  <input type="text" name="mintAmount" onChange={handleChangeMintAmount}/>
                  <Button onClick={createMintHenryk}>Create mint</Button>
                </div>
                <div>
                  <Button onClick={createExchangeBooth}>Create Exchange Booth</Button>
                </div>
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