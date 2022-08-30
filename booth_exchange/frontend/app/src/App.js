import * as anchor from "@project-serum/anchor";
import './App.css';
import React from 'react';
// import * as anchor from "@project-serum/anchor";
import { useEffect, useState } from 'react';
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
  if(item.length <= 5) {
    return item
  }
  let stringRepresentation = String(item)
  const finalString = stringRepresentation.substring(0, 5) 
    + "..." 
    + stringRepresentation.substring(stringRepresentation.length-5, stringRepresentation.length)
  return finalString
}

class DisplayVaultInformationMap extends React.Component {
  render() {    
      if(this.props.vault_info == null) {
        return ( 
          <label>
            No vaults created yet
        </label>
        )
      }
      
      
      var rows = []
      {
        [...this.props.vault_info.keys()].map(k => (
            rows.push(
            <tr key={k}>
              <td>{this.props.vault_info.get(k).mint.toBase58()}</td>
              <td>{threeDotStringRepresentation(this.props.vault_info.get(k).ata.address.toBase58())}</td>
              <td>{this.props.vault_info.get(k).current_amount}</td>
              <td>{this.props.vault_info.get(k).deposit_amount_in_booth}</td>
              <td>{threeDotStringRepresentation(this.props.vault_info.get(k).pda)}</td>
            </tr>
            )
        ))
      }

   return (
          <Table striped bordered hover size="sm">
          <thead>
              <tr>
                <th>Mint</th>
                <th>ATA</th>
                <th>Current Amount</th>
                <th>Deposit Amount in Exchange Booth</th>
                <th>PDA</th>
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
      
      var rows = []
      {
        [...this.props.accounts.keys()].map(k => (
          [...this.props.accounts.get(k).mints.keys()].map(v => (


            rows.push(
            <tr key={k + v}>
              <td>{this.props.accounts.get(k).account.publicKey.toBase58()}</td>
              <td>{this.props.accounts.get(k).mints.get(v).mint}</td>
              <td>{this.props.accounts.get(k).mints.get(v).amount}</td>
            </tr>
            )


          ))
        ))
      }
   return (
          <Table striped bordered hover size="sm">
          <thead>
              <tr>
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
  const [exchangeBoothVaultsMap, setExchangeBoothVaultsMap] = useState(new Map());
  const [myAccountInfo, setMyAccountInfo] = useState([]);
  const [createdAccountsMap, setCreatedAccountsMap] = useState(new Map());
  const updateMap = (k,v) => {
    setCreatedAccountsMap(
      new Map(createdAccountsMap.set(k,v))
    );
  }

  const updateExchangeBoothVaultsMap = (k,v) => {
    setExchangeBoothVaultsMap(
      new Map(exchangeBoothVaultsMap.set(k,v))
    );
  }

  const [refresh, setRefresh] = useState(false);

  const [loading, setLoading] = useState(false);

  const [notificationBody, setNotificationBody] = useState("Hi there");

  const [show, setShow] = useState(false);

  useEffect(() => {
    const executeUpdateOfAmounts = async () => {
      console.log("in use effect")

      const provider = await getProvider()
      const connection = provider.connection;

      for(let i = 0; i < toMintInformation.length ; i++) {
        const currentAmountInAdminAta = String(
          await getAmount(
            connection, toMintInformation[i].admin_token_account_address.address
          )
        )

        toMintInformation[i].current_amount_in_origin_admin_ata = currentAmountInAdminAta
      }

      setRefresh(!refresh)
    }

    executeUpdateOfAmounts().catch(console.error);

  }, [toMintInformation]);

  const [state, setState] = React.useState({
    first_mint_exchange_booth: "",
    second_mint_exchange_booth: "",
    to_save: "",
    to_mint_amount: "",
    mint_to_bootstrap: "",
    mint_to_bootstrap_amount: "",
    give_myself_mint: "",
    give_myself_amount: "",
    bootstrap_vault: "",
    mint_to_bootstrap_into_account: ""
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

      const account = await program.account.superSimpleSave.fetch(baseAccount.publicKey);

      setSavedMessage(account.message.toString());

      console.log('Anchor works')
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  async function getAmount(connection, ata_address) {
    let accountInfo = await getAccount(connection, ata_address);
    return accountInfo.amount
  }

  function find_mint_in_vault(mint_address) {
    for(let i = 0; i < exchangeBoothVaults.length ; i++) {
      if (mint_address == exchangeBoothVaults[i].mint.toBase58()) {
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

    let [vaultBPDAKey, _other] = (await PublicKey.findProgramAddress(
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

    updateExchangeBoothVaultsMap(
      mintA.mint.toBase58(),
      {
        'mint': mintA.mint,
        'ata': mintA.ata,
        'current_amount': mintA.current_amount,
        'deposit_amount_in_booth': mintA.deposit_amount_in_booth,
        'pda': mintA.mint.toBase58()
      }
    )

    updateExchangeBoothVaultsMap(
      mintB.mint.toBase58(),
      {
        'mint': mintB.mint,
        'ata': mintB.ata,
        'current_amount': mintB.current_amount,
        'deposit_amount_in_booth': mintB.deposit_amount_in_booth,
        'pda': mintB.mint.toBase58()
      }
    )

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
        const mint = 
        await do_giving(
          toMintInformation[i].mint,
          toMintInformation[i].admin,
          toMintInformation[i].admin_token_account_address,
          state['give_myself_amount']
        )

        const provider = await getProvider()
        const connection = provider.connection;

        let currentAmountInAdminAta = String(await getAmount(connection, toMintInformation[i].admin_token_account_address.address))

        toMintInformation[i].current_amount_in_origin_admin_ata = currentAmountInAdminAta
      }
    }

    setLoading(false)
  }

  async function depositToVaults() {
    setLoading(true)



    setLoading(false)
  }

  async function do_giving(mint, admin, admin_token_account_address, amount) {  
      const provider = await getProvider()
      const connection = provider.connection;

      let toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection, 
        admin, 
        mint, 
        provider.wallet.publicKey
      );

      await transfer(
        connection,
        admin, // should pay be the holder of the account?
        admin_token_account_address.address,
        toTokenAccount.address,
        admin.publicKey,
        amount
      );

      let amountAfter = String(await getAmount(connection, toTokenAccount.address))

      for(let i = 0; i < exchangeBoothVaults.length ; i++) {
        if (exchangeBoothVaults[i].mint.toBase58() == mint.toBase58()) {
          exchangeBoothVaults[i].current_amount = amountAfter
          return
        }
      }
      
      console.log('do deposit')
      setExchangeBoothVaults(
      current => [
        ...current,
        {
          'mint': mint,
          'ata': toTokenAccount,
          'current_amount': amount,
          'deposit_amount_in_booth': String(0)
        }
      ])

      updateExchangeBoothVaultsMap(
        mint.toBase58(),
        {
          'mint': mint,
          'ata': toTokenAccount,
          'current_amount': amount,
          'deposit_amount_in_booth': String(0),
          'pda': "NA"
        }
      )
  }

  async function createNewAccountWithMintInIt() {
    setLoading(true)

    for(let i = 0; i < toMintInformation.length ; i++) {
      if (toMintInformation[i].mint.toBase58() == state['mint_to_bootstrap']) {
        
        const checkForKey = state['mint_to_bootstrap_into_account']

        let currentRecord = createdAccountsMap.get(checkForKey)
        let newWallet = Keypair.generate();
        if(currentRecord != undefined) {
          newWallet = currentRecord['account']
        }

        const provider = await getProvider()
        const connection = provider.connection;
    
        let newTokenAccountATA = await getOrCreateAssociatedTokenAccount(
          connection, 
          toMintInformation[i].admin, 
          toMintInformation[i].mint, 
          newWallet.publicKey
        );

        await transfer(
          connection,
          toMintInformation[i].admin,
          toMintInformation[i].admin_token_account_address.address,
          newTokenAccountATA.address,
          toMintInformation[i].admin.publicKey,
          state['mint_to_bootstrap_amount']
        );
      
        const newAmountForToken = await getAmount(connection, newTokenAccountATA.address)

        let newAmountAdminAta = String(await getAmount(connection, toMintInformation[i].admin_token_account_address.address))

        toMintInformation[i].current_amount_in_origin_admin_ata = newAmountAdminAta

        const key = newWallet.publicKey.toBase58()

        let originalMints = new Map()
        if(createdAccountsMap.get(key) != undefined) {
          originalMints = createdAccountsMap.get(key).mints
        }

        originalMints.set(state['mint_to_bootstrap'], 
        {
          'mint': threeDotStringRepresentation(state['mint_to_bootstrap']),
          'amount': String(newAmountForToken)
        })

        updateMap(key, 
          {
            'account': newWallet,
            'mints': originalMints
          }
        )          

        refreshVaults()

        setBodyAndShow("New account created: " + threeDotStringRepresentation(newWallet.publicKey))
        setRefresh(!refresh)
        setLoading(false)

        return
      }
    }
  }

  async function createMintHenryk() {    
    setLoading(true)
    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    
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


    let fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      mintA,
      fromWallet.publicKey
    );

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
    
    let currentAmountInAdminAta = String(await getAmount(connection, fromTokenAccount.address))

    await do_giving(mintA, fromWallet, fromTokenAccount, state['bootstrap_vault'])

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
                          <Nav.Link eventKey="fifth">My Vaults</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="sixth">Vault Deposit</Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </Col>
                    <Col sm={9}>
                      <Tab.Content>
                        <Tab.Pane eventKey="first">
                        <div>
                          <DisplayMintInformation mint_info={toMintInformation}></DisplayMintInformation>
                        </div>
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Total to Mint
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="to_mint_amount" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Total to bootstrap vault
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="bootstrap_vault" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <Button onClick={createMintHenryk}>Create mint</Button>
                            </div>
                          </div>
                        </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="second">
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div>
                              <DisplayCreatedAccounts accounts={createdAccountsMap}></DisplayCreatedAccounts>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Account
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="mint_to_bootstrap_into_account" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Mint
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="mint_to_bootstrap" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Amount
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="mint_to_bootstrap_amount" onChange={handleGenericChange}/>
                              </span>
                          </div>
                          <div className="SomeSpace"></div>
                            <Button onClick={createNewAccountWithMintInIt}>Create address and transfer amount in there</Button>
                          </div>
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
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Mint A
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="first_mint_exchange_booth" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Mint B
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="second_mint_exchange_booth" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <Button onClick={createExchangeBooth}>Create Exchange Booth</Button>
                            </div>
                          </div>
                        </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="fifth">
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div className="SomeSpace">
                              <span className="SomeSpace">Mint </span>
                              <span className="SomeSpace">
                                <input type="text" name="give_myself_mint" onChange={handleGenericChange}/>
                                </span>
                              </div>
                              <div className="SomeSpace">
                                <span className="SomeSpace">
                                  Amount
                                </span>
                                <span className="SomeSpace">
                                  <input type="text" name="give_myself_amount" onChange={handleGenericChange}/>
                                </span>
                              </div>
                              <div className="SomeSpace">
                                <Button onClick={give_myself_amount}>Give Myself</Button>
                              </div>
                              <div>
                              <DisplayVaultInformationMap vault_info={exchangeBoothVaultsMap}></DisplayVaultInformationMap>
                              </div>
                            </div>
                          </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="sixth">
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Mint A
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="deposit_mint_a" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Mint A Amount
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="deposit_mint_a_amount" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Mint B
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="deposit_mint_b" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Mint B Amount
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="deposit_mint_b_amount" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <Button onClick={depositToVaults}>Deposit To Vaults</Button>
                            </div>
                          </div>
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