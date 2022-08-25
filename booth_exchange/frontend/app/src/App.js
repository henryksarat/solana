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
import Toast from 'react-bootstrap/Toast';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Tab from 'react-bootstrap/Tab';
import Spinner from 'react-bootstrap/Spinner';

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
            <td>{this.props.vault_info[i].current_amount}</td>
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
  
  const [toMintInformation, setToMintInformation] = useState([]);
  const [exchangeBoothVaults, setExchangeBoothVaults] = useState([]);
  const [createdAccounts, setCreatedAccounts] = useState([]);

  const [refresh, setRefresh] = useState(false);

  const [loading, setLoading] = useState(false);

  const [notificationBody, setNotificationBody] = useState("Hi there");

  const [show, setShow] = useState(false);

  const [state, setState] = React.useState({
    first_mint_exchange_booth: "",
    second_mint_exchange_booth: "",
    to_save: "",
    to_mint_amount: "",
    mint_to_bootstrap: "",
    mint_to_bootstrap_amount: "",
    give_myself_mint: "",
    give_myself_amount: "",
  })

  const wallet = useWallet();
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
      await program.rpc.initialize();
      let result = await program.rpc.superSimple(state['to_save'], {
        accounts: {
          dataLocation: baseAccount.publicKey,
          admin: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
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

  function find_mint_in_vault(mint_address) {
    for(let i = 0; i < exchangeBoothVaults.length ; i++) {
      console.log('mint is=' + exchangeBoothVaults[i].mint.toBase58())
      if (mint_address == exchangeBoothVaults[i].mint.toBase58()) {
        console.log('found one')
        return exchangeBoothVaults[i]
      }
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

    const mintA = find_mint_in_vault(state['first_mint_exchange_booth'])
    const mintB = find_mint_in_vault(state['second_mint_exchange_booth'])

    console.log("mint A=" + mintA)
    console.log("mint B=" + mintB)


    let [adminPdaKey, _adminPdaBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("ebpda"),
        mintA.mint.toBuffer(),
        mintB.mint.toBuffer(),
      ],
      programID
    ));

    let [vaultAPDAKey, _] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultA"),
        mintA.mint.toBuffer(),
      ],
      programID
    ));

    let [vaultBPDAKey, s] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultB"),
        mintB.mint.toBuffer(),
      ],
      programID
    ));
    
    console.log("adminPdaKey=" + adminPdaKey.toBase58())

    let result = await program.rpc.create("1:2", "0.2", {
      accounts: {
        payer: provider.wallet.publicKey,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        mintA: mintA.mint,
        mintB: mintB.mint,
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

  const is_loading = () => {
    if (loading) {
      return <Spinner animation="border" />
    }
  }
  
  // TODO: Clean up print statements and make into a function to use in the mint
  // process
  // TODO: add a my balance
  async function give_myself_amount() {
    setLoading(true)
    for(let i = 0; i < toMintInformation.length ; i++) {
      if (toMintInformation[i].mint.toBase58() == state['give_myself_mint']) {
        const mint = toMintInformation[i].mint
        const provider = await getProvider()
        const connection = provider.connection;

        console.log("give_myself_amount: mint is=" + mint.toBase58())
        let toTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection, 
          provider.wallet.publicKey, 
          mint, 
          provider.wallet.publicKey
        );

        console.log("give_myself_amount: ATA is=" + toTokenAccount)

        console.log("give_myself_amount: amount before:" +await getAmount(connection, toTokenAccount.address));


        console.log("give_myself_amount: amount we want=" + state['give_myself_amount'])

        console.log(toMintInformation[i].admin_token_account_address.address)

        await transfer(
          connection,
          toMintInformation[i].admin, // should pay be the holder of the account?
          toMintInformation[i].admin_token_account_address.address,
          toTokenAccount.address,
          toMintInformation[i].admin.publicKey,
          state['give_myself_amount']
        );

        console.log("give_myself_amount: amount after:" +await getAmount(connection, toTokenAccount.address));
      }
    }

    setLoading(false)
  }

  async function createNewAccountWithMintInIt() {
    setLoading(true)
    for(let i = 0; i < toMintInformation.length ; i++) {
      if (toMintInformation[i].mint.toBase58() == state['mint_to_bootstrap']) {
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
          state['mint_to_bootstrap_amount']
        );
      
        const newAmountForToken = await getAmount(connection, newTokenAccountATA.address)
        console.log(newAmountForToken);

        let newAmountAdminAta = String(await getAmount(connection, toMintInformation[i].admin_token_account_address.address))

        console.log("new amount for admin ata=" + newAmountAdminAta)

        toMintInformation[i].current_amount_in_origin_admin_ata = newAmountAdminAta

        setCreatedAccounts(current => [
          ...current,
          {
            'account': newWallet,
            'mint': threeDotStringRepresentation(state['mint_to_bootstrap']),
            'amount': String(newAmountForToken)
          }
        ])

        refreshVaults()

        setBodyAndShow("New account created: " + threeDotStringRepresentation(newWallet.publicKey))
        setRefresh(!refresh)
        setLoading(false)

        return
      }
    }

    console.log("did not find mint to create new account with balance")
  }

  async function createMintHenryk() {    
    setLoading(true)
    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    
    console.log('amout to mint=' + state['to_mint_amount'])
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
      state['to_mint_amount'],
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

    let vaultAmount = String(await getAmount(connection, toTokenAccount.address))
    console.log("vaultAmount=" + vaultAmount)

    
    let currentAmountInAdminAta = String(await getAmount(connection, fromTokenAccount.address))
		console.log("fromTokenAccount=" + currentAmountInAdminAta);
  
    setToMintInformation(current => [
      ...current,
      {
        'mint': mintA,
        'admin': fromWallet,
        'admin_token_account_address': fromTokenAccount,
        'amount_minted': originalMintAmount,
        'current_amount_in_origin_admin_ata': currentAmountInAdminAta,
      }
    ])

    setExchangeBoothVaults(
      current => [
        ...current,
        {
          'mint': mintA,
          'ata': toTokenAccount,
          'current_amount': vaultAmount
        }
    ])
    console.log('original amount=' + originalMintAmount)
    console.log('added more')

    setBodyAndShow("New Mint Created")
    setRefresh(!refresh)
    setLoading(false)
  }

function handleGenericChange(evt) {
  const value = evt.target.value;
  setState({
    ...state,
    [evt.target.name]: value
  });
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function refreshVaults() {
  const provider = await getProvider()
  const connection = provider.connection;

  for(let i = 0; i < exchangeBoothVaults.length ; i++) {
    console.log(exchangeBoothVaults[i].ata.address.toBase58())
    let amount = await getAmount(connection, exchangeBoothVaults[i].ata.address)
    exchangeBoothVaults[i].current_amount = String(37)
    console.log("amount is=" + amount)
  }
}

  async function setBodyAndShow(message) {
    setShow(true)
    setNotificationBody(message)
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
        
        
        <div>
          {is_loading()}
          {
            value && value >= Number(0) ? (
              <h2>{value}</h2>
            ) : (
              <h3>
                <div>
                  <Toast onClose={() => setShow(false)} show={show} delay={3000} autohide>
                    <Toast.Header>
                      <img
                        src="holder.js/20x20?text=%20"
                        className="rounded me-2"
                        alt=""
                      />
                      <strong className="me-auto">Bootstrap</strong>
                      <small>1 min ago</small>
                    </Toast.Header>
                    <Toast.Body>{notificationBody}</Toast.Body>
                </Toast>
                {/* <div>
                  <Button onClick={() => setShow(true)}>Show Toast</Button>
                </div> */}
                </div>

                <div>
                <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                  <Row>
                    <Col sm={3}>
                      <Nav variant="pills" className="flex-column">
                        <Nav.Item>
                          <Nav.Link eventKey="first">Mints</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="second">Accounts</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="third">Sample Smart Contract</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="fourth">Create Excahnge Booth</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="fifth">My Account</Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </Col>
                    <Col sm={9}>
                      <Tab.Content>
                        <Tab.Pane eventKey="first">
                        <div>
                          <DisplayMintInformation mint_info={toMintInformation}></DisplayMintInformation>
                          <DisplayVaultInformation vault_info={exchangeBoothVaults}></DisplayVaultInformation>
                        </div>
                        <div>
                        Total to Mint
                          <input type="text" name="to_mint_amount" onChange={handleGenericChange}/>
                          <Button onClick={createMintHenryk}>Create mint</Button>
                        </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="second">
                        <div>
                          <DisplayCreatedAccounts accounts={createdAccounts}></DisplayCreatedAccounts>
                        </div>
                        <div>
                          Mint
                          <input type="text" name="mint_to_bootstrap" onChange={handleGenericChange}/>
                          Amount
                          <input type="text" name="mint_to_bootstrap_amount" onChange={handleGenericChange}/>
                          <Button onClick={createNewAccountWithMintInIt}>Create address and transfer amount in there</Button>
                        </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="third">
                        <div>
                          Stored value: 
                          <DisplaySomething message={savedMessage}></DisplaySomething>
                        </div>
                        <div>
                          <input type="text" name="to_save" onChange={handleGenericChange}/>
                          <Button onClick={createCounter}>Execute</Button>
                        </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="fourth">
                        <div>
                          <input type="text" name="first_mint_exchange_booth" onChange={handleGenericChange}/>
                          <input type="text" name="second_mint_exchange_booth" onChange={handleGenericChange}/>
                          <Button onClick={createExchangeBooth}>Create Exchange Booth</Button>
                        </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="fifth">
                          <div>
                            <div>
                              Mint 
                              <input type="text" name="give_myself_mint" onChange={handleGenericChange}/>
                            </div>
                            <div>
                              Amount
                              <input type="text" name="give_myself_amount" onChange={handleGenericChange}/>
                            </div>
                            <Button onClick={give_myself_amount}>Give Myself</Button>
                          </div>
                        </Tab.Pane>
                      </Tab.Content>
                    </Col>
                  </Row>

                </Tab.Container>
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