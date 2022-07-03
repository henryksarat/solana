import * as anchor from "@project-serum/anchor";
import { Program, } from "@project-serum/anchor";
import { BoothExchange } from "../target/types/booth_exchange";
import { TokenMinter } from "../target/types/token_minter";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
} from "@solana/spl-token"; 
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

const BN = require("bn.js");

describe("exchange_booth", () => {
  const key = anchor.AnchorProvider.env().wallet.publicKey;
  const program = anchor.workspace.BoothExchange as Program<BoothExchange>;
  const programTokenMinter = anchor.workspace.TokenMinter as Program<TokenMinter>;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Mint a token", async () => {  
    let result = await createMint(12)
    const minted = await retrieve_amount_for_ata(result.associated_token_account);
    assert.equal(minted, 12);

    let result2 = await createMint(20)
    const minted2 = await retrieve_amount_for_ata(result2.associated_token_account);
    assert.equal(minted2, 20);

    let result3 = await createMint(0)
    const minted3 = await retrieve_amount_for_ata(result3.associated_token_account);
    assert.equal(minted3, 0);
  });

  it("Transfer to a new account",  async() => {
    let result = await createMint(12)
    const amountAdminATA = await retrieve_amount_for_ata(result.associated_token_account);
    assert.equal(amountAdminATA, 12);

    const otherKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();  
    let tomKeyATA = await getAssociatedTokenAddress(
      result.mint.publicKey,
      otherKey.publicKey
    );
    const mint_tx2 = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        key, tomKeyATA, otherKey.publicKey, result.mint.publicKey
      )
    );

    await anchor.AnchorProvider.env().sendAndConfirm(mint_tx2, []);

    const amountOther = await retrieve_amount_for_ata(tomKeyATA);
    assert.equal(amountOther, 0);

    await quickTransfer(result.associated_token_account, tomKeyATA, 3, key);

    const amountOtherAfterTransfer = await retrieve_amount_for_ata(tomKeyATA);
    assert.equal(amountOtherAfterTransfer, 3);

    const amountOfAdaminATAAfterTransfer = await retrieve_amount_for_ata(result.associated_token_account);
    assert.equal(amountOfAdaminATAAfterTransfer, 9);
  })

  it('can create and exchange booth', async () => {
    const key = anchor.AnchorProvider.env().wallet.publicKey;
   
    let mintA = await createMint(100)
    let mintB = await createMint(250)

    const admin_two: anchor.web3.Keypair = anchor.web3.Keypair.generate();  
    const admin_three: anchor.web3.Keypair = anchor.web3.Keypair.generate();  

    await program.provider.connection.requestAirdrop(admin_two.publicKey, 1000000000);
    await program.provider.connection.requestAirdrop(admin_three.publicKey, 1000000000);
    await program.provider.connection.requestAirdrop(key, 1000000000);

    let [theKey, theBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("ebpda"),
        mintA.mint.publicKey.toBuffer(),
        mintB.mint.publicKey.toBuffer()
      ],
      program.programId
    ));

    let [vaultAPDAKey, _] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultA"),
        mintA.mint.publicKey.toBuffer(),
      ],
      program.programId
    ));

    let [vaultBPDAKey, s] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultB"),
        mintB.mint.publicKey.toBuffer(),
      ],
      program.programId
    ));

    let vaultAATA = await getAssociatedTokenAddress(
      mintA.mint.publicKey,
      admin_two.publicKey
    );

    let vaultBATA = await getAssociatedTokenAddress(
      mintB.mint.publicKey,
      admin_two.publicKey
    );

    
    const mint_tx2 = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        key, vaultAATA, admin_two.publicKey, mintA.mint.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        key, vaultBATA, admin_two.publicKey, mintB.mint.publicKey
      )
    );

    await anchor.AnchorProvider.env().sendAndConfirm(mint_tx2, []);

    let vaultAPDA = await getAssociatedTokenAddress(
      mintA.mint.publicKey,
      vaultAPDAKey,
      true,
    );

    const mint_tx3 = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        key, 
        vaultAPDA, 
        vaultAPDAKey, 
        //admin_two.publicKey,//making new owner does work for some reason
        mintA.mint.publicKey
      )
    );


    await anchor.AnchorProvider.env().sendAndConfirm(mint_tx3, []);
    await quickTransfer(mintA.associated_token_account, vaultAPDA, 12, key);




    await quickTransfer(mintA.associated_token_account, vaultAATA, 15, key);
    await quickTransfer(mintB.associated_token_account, vaultBATA, 12, key);


    
    await program.methods.create("A:B,1:2").accounts({
      payer: key,
      admin: admin_two.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      mintA: mintA.mint.publicKey,
      mintB: mintB.mint.publicKey,
      dataLocation: theKey,
      vaultAPdaKey: vaultAPDAKey,
      vaultBPdaKey: vaultBPDAKey,
    }).signers([
      admin_two
    ]).rpc()

    const tweetAccount = await program.account.exchangeBooth.fetch(theKey);
    
    assert.equal(tweetAccount.payer.toBase58(), key.toBase58());
    assert.equal(tweetAccount.admin.toBase58(), admin_two.publicKey.toBase58());
    assert.equal(tweetAccount.programId.toBase58(), anchor.web3.SystemProgram.programId.toBase58());
    assert.equal(tweetAccount.oracle, 'A:B,1:2');
    assert.equal(tweetAccount.mintA.toBase58(), mintA.mint.publicKey.toBase58());
    assert.equal(tweetAccount.mintB.toBase58(), mintB.mint.publicKey.toBase58());

    assert.equal(tweetAccount.vaultA.toBase58(), vaultAPDAKey.toBase58());
    assert.equal(tweetAccount.vaultB.toBase58(), vaultBPDAKey.toBase58());

    assert.equal(tweetAccount.bump, theBump);

    // // This is what we transfered into the PDA of vault A
    // assert.equal(await retrieve_amount_for_ata(tweetAccount.vaultA), 14);
    // assert.equal(await retrieve_amount_for_ata(vaultAPDAKey), 14);

    // // Vault A we transfered out of
    // assert.equal(await retrieve_amount_for_ata(vaultAATA), 1);



    // assert.equal(await retrieve_amount_for_ata(tweetAccount.vaultB), 12);

    
  });

  it('can create super simple account', async () => {
    const data_location: anchor.web3.Keypair = anchor.web3.Keypair.generate();  

    const realAdminKey = anchor.AnchorProvider.env().wallet.publicKey;

    await program.methods.superSimple().accounts({
        admin: realAdminKey,
        dataLocation: data_location.publicKey,
      }).signers([
        data_location
      ]).rpc();
      
      
    const tweetAccount = await program.account.superSimpleSave.fetch(data_location.publicKey);
    
    assert.equal(tweetAccount.callCount, 59);
  });

  async function createMint(amount) {
    const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();  
    const lamports: number = await programTokenMinter.provider.connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );
    let associatedTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      key
    );
      
    const mint_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: key,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID, // owner
        lamports,
      }),
      createInitializeMintInstruction(
        mintKey.publicKey, 6, key, key
      ),
      createAssociatedTokenAccountInstruction(
        key, associatedTokenAccount, key, mintKey.publicKey
      )
    );

    const res = await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [mintKey]);

    var amount = new BN(amount, 10);

    await programTokenMinter.methods.mintToken(amount).accounts({
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: associatedTokenAccount,
      authority: key,
    }).rpc();

    return {
      mint: mintKey,
      associated_token_account: associatedTokenAccount
    }
  }

  async function retrieve_amount_for_ata(account: anchor.web3.PublicKey) {
    return (
      await programTokenMinter.provider.connection.getParsedAccountInfo(
        account
      )
    ).value.data.parsed.info.tokenAmount.amount;
  }

  async function quickTransfer(from, to, amount, signer) {
    await programTokenMinter.methods.transferToken(new BN(amount, 10)).accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      from: from,
      to: to,
      fromAuthority: signer,
    }).rpc();
  }
});



