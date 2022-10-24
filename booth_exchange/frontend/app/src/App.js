

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
import Badge from 'react-bootstrap/Badge';

import DisplayMintInformation from './components/mints/DisplayMintInformation'
import ShorthandWithToolTip from './components/ShorthandWithToolTip'
import DisplayExchangeBooths from './components/DisplayExchangeBooths'
import DisplayCreatedAccounts from './components/accounts/DisplayCreatedAccounts'
import DisplayVaultInformationMap from './components/DisplayVaultInformationMap'
import {threeDotStringRepresentation} from './helpers/stringUtil'
import {renderTooltip} from './helpers/uiHelperUtil'
import {superSimple} from './helpers/smartContractHelper'

import {
  createMint,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
  mintTo,
  getAccount,
  transfer,
} from "@solana/spl-token"; 
import { set } from "@project-serum/anchor/dist/cjs/utils/features";
require('@solana/wallet-adapter-react-ui/styles.css');
const BN = require("bn.js");

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

const ColoredLine = ({ color }) => (
  <hr
      style={{
          color: color,
          backgroundColor: color,
          height: 5
      }}
  />
);

function App() {
  const [value, setValue] = useState(null);
  const [savedMessage, setSavedMessage] = useState(null);
  
  const [toMintInformation, setToMintInformation] = useState([]);
  const [exchangeBooth, setExchangeBooth] = useState([]);
  const [exchangeBoothVaultsMap, setExchangeBoothVaultsMap] = useState(new Map());
  const [createdAccountsMap, setCreatedAccountsMap] = useState(new Map());
  const [aliasToMintMap, setAliasToMintMap] = useState(new Map());

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

  const updateAliasToMintMap = (k,v) => {
    setAliasToMintMap(
      new Map(aliasToMintMap.set(k,v))
    );
  }

  const [refresh, setRefresh] = useState(false);

  const [loading, setLoading] = useState(false);

  const [notificationBody, setNotificationBody] = useState("Hi there");

  const [show, setShow] = useState(false);

  const [bootStrapAccounts, setBootstrapAccounts] = useState(false)

  const [bootStrapExchangeBooth, setBootStrapExchangeBooth] = useState(false)
  

  useEffect(() => {
    const executeUpdateOfAmounts = async () => {
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

    if (bootStrapAccounts) {
      createNewAccountWithMintInItWithParams('WHEAT', undefined, 10)
      createNewAccountWithMintInItWithParams('STONE', undefined, 10)
      createNewAccountWithMintInItWithParams('WATER', undefined, 10)   
    }

    if (bootStrapExchangeBooth) {
      //ICE 1000 total, 500 in Admin
      //WHEAT 2000 total, 1000 in Admin
      //STONE 3000 total, 1500 in Admin
      //WATER 4000 total, 2000 in Admin

      depositToVaultsWithParams('ICE', 'WATER', 200, 700)
    }
  }, [toMintInformation, bootStrapAccounts, bootStrapExchangeBooth]);

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
    mint_to_bootstrap_into_account: "",
    exchange_booth_rate: "1:2",
    exchange_booth_fee: "0.2"
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
    const program = new Program(idl, programID, provider);

    try {
      const account = await superSimple(
        state['to_save'], 
        baseAccount.publicKey,
        provider.wallet.publicKey,
        baseAccount,
        program
      )
      setSavedMessage(account.message.toString());

      console.log('Anchor works')
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  async function  getAmount(connection, ata_address) {
    let accountInfo = await getAccount(connection, ata_address);
    return accountInfo.amount
  }

  async function createExchangeBooth() {
    setLoading(true)
    await createExchangeBoothWithParams(
      state.first_mint_exchange_booth, 
      state.second_mint_exchange_booth,
      state.exchange_booth_rate,
      state.exchange_booth_fee
    )
    setLoading(false)
  }

  async function createExchangeBoothWithParams(
    first_mint_exchange_booth, 
    second_mint_exchange_booth,
    exchange_booth_rate,
    exchange_booth_fee
  ) {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    const firstMint = getMintFromAlias(first_mint_exchange_booth)
    const secondMint = getMintFromAlias(second_mint_exchange_booth)
    
    console.log("program_id=" +programID)

    console.log("first one=" + firstMint)
    console.log("second one=" + secondMint)
    console.log("rate=" + exchange_booth_rate)
    console.log("fee=" + exchange_booth_fee)

    if (exchangeBoothVaultsMap.size < 2) {
      console.log('not enough mints')
      return
    }

    const mintA = exchangeBoothVaultsMap.get(firstMint)
    const mintB = exchangeBoothVaultsMap.get(secondMint)


    console.log("mint A=" + mintA)
    console.log("mint B=" + mintB)

    if (mintA == undefined || mintB== undefined) {
      console.log('Undefined mints')
      return
    }

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

    let result = await program.rpc.create(exchange_booth_rate, exchange_booth_fee, {
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

    // Simply to set the PDA key
    updateExchangeBoothVaultsMap(
      mintA.mint.toBase58(),
      {
        'mint': mintA.mint,
        'ata': mintA.ata,
        'current_amount': mintA.current_amount,
        'deposit_amount_in_booth': String(0),
        'pda': vaultAPDAKey
      }
    )

    // Simply to set the PDA key
    updateExchangeBoothVaultsMap(
      mintB.mint.toBase58(),
      {
        'mint': mintB.mint,
        'ata': mintB.ata,
        'current_amount': mintB.current_amount,
        'deposit_amount_in_booth': String(0),
        'pda': vaultBPDAKey
      }
    )

    console.log("result = " + JSON.stringify(result))
    console.log("program_id="+programID)
    console.log("pda key="+adminPdaKey)

    const currentExchangeBooth = await program.account.exchangeBooth.fetch(adminPdaKey);

    setExchangeBooth(current => [
      ...current,
      {
        'alias_mint_a': getAliasFromMintPublicKey(currentExchangeBooth.mintA.toString()),
        'alias_mint_b': getAliasFromMintPublicKey(currentExchangeBooth.mintB.toString()),
        'mint_a': currentExchangeBooth.mintA.toString(),
        'mint_b': currentExchangeBooth.mintB.toString(),
        'fee': currentExchangeBooth.fee.toString(),
        'rate': currentExchangeBooth.oracle.toString()
      }
    ])
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

    const giveMyselfMint = getMintFromAlias(state.give_myself_mint)

    console.log("give myself the following mint=" + giveMyselfMint)

    for(let i = 0; i < toMintInformation.length ; i++) {
      if (toMintInformation[i].mint_base58 == giveMyselfMint) {
        const mint = 
        await do_giving(
          toMintInformation[i].mint,
          toMintInformation[i].admin,
          toMintInformation[i].admin_token_account_address,
          state.give_myself_amount
        )

        const provider = await getProvider()
        const connection = provider.connection;

        let currentAmountInAdminAta = String(await getAmount(connection, toMintInformation[i].admin_token_account_address.address))

        toMintInformation[i].current_amount_in_origin_admin_ata = currentAmountInAdminAta
      }
    }

    refreshVaults()
    setLoading(false)
  }

  async function refreshAll() {
    refreshVaults()
    refreshAccounts()
  }


  async function depositToVaults() {
    setLoading(true)

    depositToVaultsWithParams(
      state.deposit_mint_a,
      state.deposit_mint_b,
      state.deposit_mint_a_amount,
      state.deposit_mint_b_amount
    )

    setLoading(false)
  }

  async function depositToVaultsWithParams(
    deposit_mint_a, 
    deposit_mint_b, 
    deposit_mint_a_amount,
    deposit_mint_b_amount
  ) {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);

    const firstMintString = getMintFromAlias(deposit_mint_a)
    const secondMintString = getMintFromAlias(deposit_mint_b)

    const firstMint = exchangeBoothVaultsMap.get(firstMintString)
    const secondMint = exchangeBoothVaultsMap.get(secondMintString)

    console.log("depositToVaults=" + firstMint.mint.toBase58())
    console.log("depositToVaults=" + secondMint.mint.toBase58())

    let [adminPdaKey, adminPdaBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("ebpda"),
        firstMint.mint.toBuffer(),
        secondMint.mint.toBuffer()
      ],
      program.programId
    ));

    let [vaultAPDAKey, _] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultA"),
        firstMint.mint.toBuffer(),
      ],
      programID
    ));

    let [vaultBPDAKey, _other] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultB"),
        secondMint.mint.toBuffer(),
      ],
      programID
    ));

    let vaultAATA = await getAssociatedTokenAddress(
      firstMint.mint,
      provider.wallet.publicKey
    );

    let vaultBATA = await getAssociatedTokenAddress(
      secondMint.mint,
      provider.wallet.publicKey
    );

    console.log("Execute deposit now")
    let result = await program.rpc.deposit(
        new BN(deposit_mint_a_amount, 10), 
        new BN(deposit_mint_b_amount, 10)
      , { accounts:{
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
      mintA: firstMint.mint,
      mintB: secondMint.mint,
      vaultATransferOutOf: vaultAATA,
      vaultBTransferOutOf: vaultBATA,
      dataLocation: adminPdaKey,
      vaultAPda: vaultAPDAKey,
      vaultBPda: vaultBPDAKey,
      admin: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      programmId: program.programId,
    }});

    console.log("Result from deposit=" + result)
   
    refreshVaults()
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

      console.log('do deposit')

      let mintVaultInfo = exchangeBoothVaultsMap.get(mint.toBase58())

      if(mintVaultInfo == undefined) {
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
  }


  async function createNewAccountWithMintInIt() {
    setLoading(true)

    createNewAccountWithMintInItWithParams(
      state.mint_to_bootstrap, 
      state.mint_to_bootstrap_into_account,
      state.mint_to_bootstrap_amount
    )

    setRefresh(!refresh)
    setLoading(false)
  }

  async function createNewAccountWithMintInItWithParams(
    mint_to_bootstrap, 
    mint_to_bootstrap_into_account,
    mint_to_bootstrap_amount
  ) {
    const mintToBootstrap = getMintFromAlias(mint_to_bootstrap)

    for(let i = 0; i < toMintInformation.length ; i++) {
      if (toMintInformation[i].mint.toBase58() == mintToBootstrap) {
        
        const checkForKey = mint_to_bootstrap_into_account

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
          mint_to_bootstrap_amount
        );
      
        const newAmountForToken = await getAmount(connection, newTokenAccountATA.address)

        let newAmountAdminAta = String(
          await getAmount(
            connection, toMintInformation[i].admin_token_account_address.address
            )
          )

        toMintInformation[i].current_amount_in_origin_admin_ata = newAmountAdminAta

        const key = newWallet.publicKey.toBase58()

        if(createdAccountsMap.get(key) == undefined) {
          updateMap(key, 
            {
              'account': newWallet,
              'mints': new Map()
            }
          ) 
        }

        let originalMints = createdAccountsMap.get(key).mints

        if(originalMints.get(mintToBootstrap) == undefined) {
          console.log("DO THE SET")
          originalMints.set(mintToBootstrap, 
          {
            'mint': threeDotStringRepresentation(mintToBootstrap),
            'full_mint': toMintInformation[i].mint,
            'amount': String(newAmountForToken),
            'ata': newTokenAccountATA,
            'alias': getAliasFromMintPublicKey(mintToBootstrap)
          })

          updateMap(key, 
            {
              'account': newWallet,
              'mints': originalMints
            }
          )
        } else {
          console.log("DO THE REFRESH")
          refreshAccounts()
        }

        setBodyAndShow("New account created: " + threeDotStringRepresentation(newWallet.publicKey))

        break
      }
    }
  }

  async function refreshAccounts() {
    const provider = await getProvider()
    const connection = provider.connection;

    console.log("refresh accounts")
    for (let [key, _] of createdAccountsMap) {
      console.log("refresh accounts=" + key)
      let accountInfo = createdAccountsMap.get(key)

      let mints = accountInfo.mints

      for (let [mintKey, _] of mints) {
        let singleMint = mints.get(mintKey)
        singleMint.amount =  String(await getAmount(connection, singleMint.ata.address))
      }

      updateMap(key, 
      {
        'account': accountInfo.account,
        'mints': mints
      })
    }
  }

  async function createMintFromState() {    
    setLoading(true)

    const provider = await getProvider()
    const connection = provider.connection;
    const fromWallet = Keypair.generate();

    const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, 2*LAMPORTS_PER_SOL);
    const result = await connection.confirmTransaction(fromAirdropSignature);
    console.log("fromAirdropSignature="+fromAirdropSignature)
    console.log("result="+result)

    await createMintWithParams(
      fromWallet,
      state.to_mint_amount, 
      state.alias, 
      state.bootstrap_vault
    )

    setBodyAndShow("New Mint Created")
    setRefresh(!refresh)
    setLoading(false)
  }

  async function bootStrap() {
    const executeUpdateOfAmounts = async () => {
      const provider = await getProvider()
      const connection = provider.connection;
      const fromWallet = Keypair.generate();

      const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, 2*LAMPORTS_PER_SOL);
      const result = await connection.confirmTransaction(fromAirdropSignature);
      console.log("fromAirdropSignature="+fromAirdropSignature)
      console.log("result="+result)

      await createMintWithParams(fromWallet, 1000, 'ICE', 500)
      await createMintWithParams(fromWallet, 2000, 'WHEAT', 1000)
      await createMintWithParams(fromWallet, 3000, 'STONE', 1500)
      await createMintWithParams(fromWallet, 4000, 'WATER', 2000)
    }
    await executeUpdateOfAmounts().catch(console.error);

    setBootstrapAccounts(true)
  }

  async function bootStrapSmartContract() {
    await createExchangeBoothWithParams("ICE", "WATER", "1:2", "0.05")
    setBootStrapExchangeBooth(true)
  }

  async function createMintWithParams(fromWallet, to_mint_amount, alias, bootstrap_vault) {
    const provider = await getProvider()
    const connection = provider.connection;

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
      to_mint_amount,
      [fromWallet]
    );
		
    const originalMintAmount = String(await getAmount(connection, fromTokenAccount.address))
    
    let currentAmountInAdminAta = String(await getAmount(connection, fromTokenAccount.address))

    await do_giving(mintA, fromWallet, fromTokenAccount, bootstrap_vault)

    console.log("will set mint")
    await setToMintInformation(current => [
      ...current,
      {
        'alias': alias,
        'mint': mintA,
        'admin': fromWallet,
        'admin_public_key_base58': fromWallet.publicKey.toBase58(),
        'admin_token_account_address': fromTokenAccount,
        'admin_token_account_address_address_base58': fromTokenAccount.address.toBase58(),
        'mint_base58': mintA.toBase58(),
        'amount_minted': originalMintAmount,
        'current_amount_in_origin_admin_ata': currentAmountInAdminAta,
      }
    ])

    updateAliasToMintMap(alias, mintA.toBase58())
  }













function handleGenericChange(evt) {
  const value = evt.target.value;
  setState({
    ...state,
    [evt.target.name]: value
  });
}

async function swapTokens(evt) {

  setLoading(true)
  const fromMint = getMintFromAlias(state.swap_from_mint)
  const toMint = getMintFromAlias(state.swap_to_mint)
  const fromAmount = state.swap_from_amount
  const account = state.swap_account

  const sourceAccount = createdAccountsMap.get(account)

  const fromMintAccount = sourceAccount.mints.get(fromMint)
  const toMintAccount = sourceAccount.mints.get(toMint)

  const provider = await getProvider()
  /* create the program interface combining the idl, program ID, and provider */
  const program = new Program(idl, programID, provider);

  console.log("from account ata stored=" + fromMintAccount.ata.address)
  console.log("to account ata stored=" + toMintAccount.ata.address)
  console.log("mint public key=" + fromMintAccount.full_mint)

  let ataOfFromMintForAccount = await getAssociatedTokenAddress(
    sourceAccount.mints.get(fromMint).full_mint,
    createdAccountsMap.get(account).account.publicKey
  );

  let ataOfToMintAccount = await getAssociatedTokenAddress(
    sourceAccount.mints.get(toMint).full_mint,
    createdAccountsMap.get(account).account.publicKey
  );

  console.log("found ata of FROM mint=" + ataOfFromMintForAccount)
  console.log("found ata of TO mint=" + ataOfToMintAccount)

  let [adminPdaKey, _adminPdaBump] = (await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode("ebpda"),
      fromMintAccount.full_mint.toBuffer(),
      toMintAccount.full_mint.toBuffer(),
    ],
    programID
  ));

  let [vaultAPDAKey, _] = (await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode("EBVaultA"),
      fromMintAccount.full_mint.toBuffer(),
    ],
    programID
  ));

  let [vaultBPDAKey, _other] = (await PublicKey.findProgramAddress(
    [
      anchor.utils.bytes.utf8.encode("EBVaultB"),
      toMintAccount.full_mint.toBuffer(),
    ],
    programID
  ));

  let result = await program.rpc.executeTrade(
    new BN(fromAmount, 10), 
    fromMintAccount.full_mint,
    toMintAccount.full_mint,
    { 
    accounts:{
      // usually would be the person we 
      // made the account for but this is a simulation
      payer: provider.wallet.publicKey, 
      systemProgram: SystemProgram.programId,
      customer: sourceAccount.account.publicKey,
      mintA: fromMintAccount.full_mint,
      mintB: toMintAccount.full_mint,
      vaultACustomer: ataOfFromMintForAccount,
      vaultBCustomer: ataOfToMintAccount,
      dataLocation: adminPdaKey,
      vaultAPda: vaultAPDAKey,
      vaultBPda: vaultBPDAKey,
      admin: provider.wallet.publicKey,
      programmId: program.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    signers:[sourceAccount.account]
  });

  console.log('done doing swap=' + result)
  
  refreshAll()
  setLoading(false)
}

async function refreshVaults() {

  console.log('refreshVaults')
  const provider = await getProvider()
  const connection = provider.connection;

  for (let [key, _] of exchangeBoothVaultsMap) {
    
      let mintVaultInfo = exchangeBoothVaultsMap.get(key)

      let amount = String(await getAmount(connection, mintVaultInfo.ata.address))
      
      let pdaAmount = String(0)

      if (mintVaultInfo.pda != "NA" ) {
        pdaAmount = String(await getAmount(connection, mintVaultInfo.pda))
      }

      updateExchangeBoothVaultsMap(
        key,
        {
          'mint': mintVaultInfo.mint,
          'ata': mintVaultInfo.ata,
          'current_amount': amount,
          'deposit_amount_in_booth': pdaAmount,
          'pda': mintVaultInfo.pda
        }
      )
    } 
}

function getMintFromAlias(alias) {
  // PublicKey is 44 characters
  if(alias.length >= 40) {
    return alias
  } else {
    return aliasToMintMap.get(alias)
  }
}

function getAliasFromMintPublicKey(mint_base58) {
  for (let [key, value] of aliasToMintMap) {
    if(value == mint_base58) {
      return key
    }
  }

  return ""
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
                  <div className="CenterFullScren">
                    <header>
                      <h1>
                        Auction House
                      </h1>
                    </header>
                  </div>
                  <ColoredLine color="#00c2cb" />
                <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                  <Row>
                    <Col sm={3}>
                      <Nav variant="pills" className="flex-column">
                        <Nav.Item>
                          <Nav.Link eventKey="first">
                            <span class="TabText">Mints</span>
                          <Badge pill bg="dark">{toMintInformation.length}</Badge>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="second">
                            <span class="TabText">Accounts</span>
                            <Badge pill bg="dark">{createdAccountsMap.size}</Badge>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="third">Sample Smart Contract</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="fourth">
                            <span class="TabText">Create Exchange Booth</span>
                            <Badge pill bg="dark">{exchangeBooth.length}</Badge>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="fifth">
                            <span class="TabText">Vaults</span>
                            <Badge pill bg="dark">{exchangeBoothVaultsMap.size}</Badge>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="sixth">Vault Deposit</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="seventh">Swap</Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </Col>
                    <Col sm={9}>
                      <Tab.Content>
                        <Tab.Pane eventKey="first">
                        <div>
                          <DisplayMintInformation 
                          mint_info={toMintInformation}
                          renderTooltip={(props, text)=>renderTooltip(props, text)}
                          ></DisplayMintInformation>
                        </div>
                        <ColoredLine color="#00c2cb" />
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Alias
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="mint_alias" onChange={handleGenericChange}/>
                              </span>
                            </div>
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
                              <Button onClick={createMintFromState}>Create mint</Button>
                            </div>
                            <div className="SomeSpace">
                              <Button variant="warning" onClick={bootStrap}>Bootstrap Environment</Button>
                            </div>
                            <div className="SomeSpace">
                              <Button variant="warning" onClick={bootStrapSmartContract}>Bootstrap Exchange Smart Contract</Button>
                            </div>
                          </div>
                        </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="second">
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div>
                              <DisplayCreatedAccounts
                                accounts={createdAccountsMap}
                              >
                              </DisplayCreatedAccounts>
                            </div>
                            <ColoredLine color="#00c2cb" />
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
                        <ColoredLine color="#00c2cb" />
                        <div>
                          <input type="text" name="to_save" onChange={handleGenericChange}/>
                          <Button onClick={createCounter}>Execute</Button>
                        </div>
                        </Tab.Pane>
                        <Tab.Pane eventKey="fourth">
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div>
                              <DisplayExchangeBooths exchange_booth_info={exchangeBooth}>
                              </DisplayExchangeBooths>
                            </div>
                            <ColoredLine color="#00c2cb" />
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
                              <span className="SomeSpace">
                                Fee for booth
                              </span>
                              <span className="SomeSpace">
                                <input type="text"  value={state.exchange_booth_fee} name="exchange_booth_fee" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Exchange Rate
                              </span>
                              <span className="SomeSpace">
                                <input type="text" value={state.exchange_booth_rate} name="exchange_booth_rate" onChange={handleGenericChange}/>
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
                            <div>
                              <DisplayVaultInformationMap 
                                vault_info={exchangeBoothVaultsMap}
                                alias_loopup={(mint_base58) => getAliasFromMintPublicKey(mint_base58)}
                                renderTooltip={(props, text)=>renderTooltip(props, text)}
                              >
                              </DisplayVaultInformationMap>
                            </div>
                            <ColoredLine color="#00c2cb" />
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
                        <Tab.Pane eventKey="seventh">
                        <div className="CenterFullScren">
                          <div className="JustAForm">
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                Account
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="swap_account" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                From Mint
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="swap_from_mint" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                From Mint Amount
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="swap_from_amount" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <span className="SomeSpace">
                                To Mint
                              </span>
                              <span className="SomeSpace">
                                <input type="text" name="swap_to_mint" onChange={handleGenericChange}/>
                              </span>
                            </div>
                            <div className="SomeSpace">
                              <Button onClick={swapTokens}>Execute Swap</Button>
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