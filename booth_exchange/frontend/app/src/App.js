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
            <td>{threeDotStringRepresentation(this.props.mint_info[i].admin.publicKey.toBase58())}</td>
            <td>{threeDotStringRepresentation(this.props.mint_info[i].admin_token_account_address.address.toBase58())}</td>
            <td>{this.props.mint_info[i].amount_minted}</td>
            <td>{this.props.mint_info[i].current_amount_in_origin_admin_ata}</td>
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
                <th>Current Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
            
          </Table>
   );
 }
}


function threeDotStringRepresentation(item) {
  let stringRepresentation = String(item)
  const finalString = stringRepresentation.substring(0, 5) 
    + "..." 
    + stringRepresentation.substring(stringRepresentation.length-5, stringRepresentation.length)
  return finalString
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
            <td>{threeDotStringRepresentation(this.props.vault_info[i].ata.address.toBase58())}</td>
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

class DisplayCreatedAccounts extends React.Component {
  render() {    
      if(this.props.accounts == null || this.props.accounts.length == 0) {
        return ( 
          <label>
            No accounts created yet
        </label>
        )
      }
      console.log("accounts=" + this.props.accounts.length)
      
      var rows = []
      for(let i = 0; i < this.props.accounts.length ; i++) {
        
        rows.push(
          <tr key={i}>
            <td>{i}</td>
            <td>{this.props.accounts[i].account.publicKey.toBase58()}</td>
            <td>{this.props.accounts[i].mint}</td>
            <td>{this.props.accounts[i].amount}</td>
          </tr>
          )
      }

   return (
          <Table striped bordered hover size="sm">
          <thead>
              <tr>
                <th>index</th>
                <th>Account</th>
                <th>Mint</th>
                <th>Amount</th>
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
  const [exchangeBoothVaults, setExchangeBoothVaults] = useState(null);
  const [createdAccounts, setCreatedAccounts] = useState([]);

  const [refresh, setRefresh] = useState(false);
  const [toSetToMintAmount, setToMintAmount] = useState(null);
  const [mintToBootStrap, setMintToBootStrap] = useState(null);
  const [mintToBootStrapAmount, setMintToBootStrapAmount] = useState(null);

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

  async function getAmount(connection, ata_address) {
    let accountInfo = await getAccount(connection, ata_address);
    console.log("current_amount=" + accountInfo.amount)
    return accountInfo.amount
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

  async function createNewAccountWithMintInIt() {
    for(let i = 0; i < toMintInformation.length ; i++) {
      
      if (toMintInformation[i].mint.toBase58() == mintToBootStrap) {
        console.log("Mint found to transfer")

        const newWallet = Keypair.generate();

        const provider = await getProvider()
        const connection = provider.connection;
    
        let newTokenAccountATA = await getOrCreateAssociatedTokenAccount(
          connection, 
          toMintInformation[i].admin, 
          toMintInformation[i].mint, 
          newWallet.publicKey
        );
    
        console.log("newTokenAccountATA="+newTokenAccountATA)
        
        console.log(await getAmount(connection, newTokenAccountATA.address));

        await transfer(
          connection,
          toMintInformation[i].admin,
          toMintInformation[i].admin_token_account_address.address,
          newTokenAccountATA.address,
          toMintInformation[i].admin.publicKey,
          mintToBootStrapAmount
        );
      
        const newAmountForToken = await getAmount(connection, newTokenAccountATA.address)
        console.log(newAmountForToken);

        let newAmountAdminAta = String(await getAmount(connection, toMintInformation[i].admin_token_account_address.address))

        console.log("new maount for admin ata=" + newAmountAdminAta)

        toMintInformation[i].current_amount_in_origin_admin_ata = newAmountAdminAta

        let newItems = createdAccounts;
        newItems.push(
          {
            'account': newWallet,
            'mint': threeDotStringRepresentation(mintToBootStrap),
            'amount': String(newAmountForToken)
        })
        setCreatedAccounts(newItems)


        setRefresh(!refresh)

        return
      }
    }

    console.log("did not find mint to create new account with balance")
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

		console.log(await getAmount(connection, fromTokenAccount.address));

    let signature = await mintTo(
      connection,
      fromWallet,
      mintA,
      fromTokenAccount.address,
      fromWallet.publicKey,
      toSetToMintAmount,
      [fromWallet]
    );
		
    const originalMintAmount = String(await getAmount(connection, fromTokenAccount.address))

    console.log(originalMintAmount);

    console.log(`Mint to signature: ${signature}`);

    let toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection, 
      fromWallet, 
      mintA, 
      provider.wallet.publicKey
    );



    console.log(`toTokenAccount ${toTokenAccount.address}`);

  console.log("toTokenAccount=" + await getAmount(connection, toTokenAccount.address))

  signature = await transfer(
    connection,
    fromWallet,
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet.publicKey,
    10
  );

    console.log(`transfer: ${signature}`);

    //toTokenMintA_Info = await getAccount(connection, toTokenAccount.address);
    console.log("toTokenMintA_Info=" + await getAmount(connection, toTokenAccount.address))

    
    let currentAmountInAdminAta = String(await getAmount(connection, fromTokenAccount.address))
		console.log("fromTokenAccount=" + currentAmountInAdminAta);
    if(toMintInformation == undefined) {
      setToMintInformation([
        {
          'mint': mintA,
          'admin': fromWallet,
          'admin_token_account_address': fromTokenAccount,
          'amount_minted': originalMintAmount,
          'current_amount_in_origin_admin_ata': currentAmountInAdminAta
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
          'amount_minted': originalMintAmount,
          'current_amount_in_origin_admin_ata': currentAmountInAdminAta
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

  async function handleMintToBootStrap(e){
    setMintToBootStrap(e.target.value);
    console.log('set to mint = ' + e.target.value);
  }

  async function handleMintToBootStrapAmount(e){
    setMintToBootStrapAmount(e.target.value);
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
                <div>
                  Mint
                  <input type="text" name="mintToBootStrap" onChange={handleMintToBootStrap}/>
                  Amount
                  <input type="text" name="mintToBootStrapAmount" onChange={handleMintToBootStrapAmount}/>
                  <Button onClick={createNewAccountWithMintInIt}>Create address and transfer amount in there</Button>
                </div>
                <div>
                  <DisplayCreatedAccounts accounts={createdAccounts}></DisplayCreatedAccounts>
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