import * as anchor from "@project-serum/anchor";
import { Program, } from "@project-serum/anchor";
import { BoothExchange } from "../target/types/booth_exchange";
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

describe("booth_exchange", () => {
//   // Configure the client to use the local cluster.

  const key = anchor.AnchorProvider.env().wallet.publicKey;
  const program = anchor.workspace.BoothExchange as Program<BoothExchange>;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("Mint a token", async () => {  
    let result = await createMint(12)
    const minted = (await program.provider.connection.getParsedAccountInfo(result[1])).value.data.parsed.info.tokenAmount.amount;
    assert.equal(minted, 12);

    let result2 = await createMint(20)
    const minted2 = (await program.provider.connection.getParsedAccountInfo(result2[1])).value.data.parsed.info.tokenAmount.amount;
    assert.equal(minted2, 20);

    let result3 = await createMint(0)
    const minted3 = (await program.provider.connection.getParsedAccountInfo(result3[1])).value.data.parsed.info.tokenAmount.amount;
    assert.equal(minted3, 0);
  });

  async function createMint(amount) {
    const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();  
      const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(
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
          mintKey.publicKey, 0, key, key
        ),
        createAssociatedTokenAccountInstruction(
          key, associatedTokenAccount, key, mintKey.publicKey
        )
      );

      const res = await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [mintKey]);
  
      var amount = new BN(amount, 10);
  
      await program.methods.mintToken(amount).accounts({
        mint: mintKey.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenAccount: associatedTokenAccount,
        authority: key,
      }).rpc();

    return [mintKey, associatedTokenAccount]
  }

  

  it('can crate and exchange booth', async () => {
    // Call the "SendTweet" instruction.
    const key = anchor.AnchorProvider.env().wallet.publicKey;
   
    let mintA = await createMint(100)
    let mintB = await createMint(250)
    
    let [theKey, theBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("ebpda"),
        key.toBuffer(),
        mintA[0].publicKey.toBuffer(),
        mintB[0].publicKey.toBuffer()
      ],
      program.programId
    ));

    await program.methods.create("A:B,1:2").accounts({
            admin: key,
            systemProgram: anchor.web3.SystemProgram.programId,
            mintA: mintA[0].publicKey,
            mintB: mintB[0].publicKey,
            vaultA: mintA[1],
            vaultB: mintB[1],
            dataLocation: theKey
    }).rpc();
    
    const tweetAccount = await program.account.exchangeBooth.fetch(theKey);
    console.log("tweet account=")
    console.log(tweetAccount);
    
    assert.equal(tweetAccount.admin.toBase58(), key.toBase58());
    assert.equal(tweetAccount.programId.toBase58(), anchor.web3.SystemProgram.programId.toBase58());
    assert.equal(tweetAccount.oracle, 'A:B,1:2');
    assert.equal(tweetAccount.callCount, 23);
    assert.equal(tweetAccount.mintA.toBase58(), mintA[0].publicKey.toBase58());
    assert.equal(tweetAccount.mintB.toBase58(), mintB[0].publicKey.toBase58());

    assert.equal(tweetAccount.vaultA.toBase58(), mintA[1].toBase58());
    assert.equal(tweetAccount.vaultB.toBase58(), mintB[1].toBase58());

    assert.equal(tweetAccount.bump, theBump);
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
});
