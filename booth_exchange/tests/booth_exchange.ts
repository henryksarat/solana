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
import { assert, expect } from "chai";

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

    let decimals = (await programTokenMinter.provider.connection.getParsedAccountInfo(
        result.mint.publicKey
      )
    ).value.data.parsed.info.decimals
    assert(decimals, "6")

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

  it('can create an exchange booth', async () => {
    let result = await createExchangeBooth("1:2", 100, 250, 0.025)

    const exchangeBoothAccount = await program.account.exchangeBooth.fetch(result.adminPdaKey);
    
    assert.equal(exchangeBoothAccount.payer.toBase58(), key.toBase58());
    assert.equal(exchangeBoothAccount.admin.toBase58(), result.admin.publicKey.toBase58());
    assert.equal(exchangeBoothAccount.programId.toBase58(), anchor.web3.SystemProgram.programId.toBase58());
    assert.equal(exchangeBoothAccount.oracle, '1:2');
    assert.equal(exchangeBoothAccount.mintA.toBase58(), result.mintA.mint.publicKey.toBase58());
    assert.equal(exchangeBoothAccount.mintB.toBase58(), result.mintB.mint.publicKey.toBase58());

    assert.equal(exchangeBoothAccount.vaultA.toBase58(), result.vaultAPDAKey.toBase58());
    assert.equal(exchangeBoothAccount.vaultB.toBase58(), result.vaultBPDAKey.toBase58());

    assert.equal(exchangeBoothAccount.bump, result.adminPdaBump);
    expect(exchangeBoothAccount.fee).to.be.closeTo(0.025, 0.000000001);
  });

  it('will fail on left of the colon in wrong format', async () => {
    try {
      await createExchangeBooth("a1:2")
    } catch (error) {
      assert.equal(
        error.error.errorMessage, 
        'Left exchange rate is in the incorrect format in the Oracle.'
      );
      return;
    }

    assert.fail('Should not get to this point')
  });

  it('will fail on right of the colon in wrong format', async () => {
    try {
      await createExchangeBooth("1:2b")
    } catch (error) {
      assert.equal(
        error.error.errorMessage, 
        'Right exchange rate is in the incorrect format in the Oracle.'
      );
      return;
    }

    assert.fail('Should not get to this point')
  });

  it('will fail because the exchange rate in the Oracle has no colons', async () => {
    try {
      await createExchangeBooth("12")
    } catch (error) {
      assert.equal(
        error.error.errorMessage, 
        'Format of the exchange rate in the oracle is incorrect.'
      );
      return;
    }

    assert.fail('Should not get to this point')
  });

  it('will fail because the exchange rate in the Oracle multiple colons', async () => {
    try {
      await createExchangeBooth("1:2:")
    } catch (error) {
      assert.equal(
        error.error.errorMessage, 
        'Format of the exchange rate in the oracle is incorrect.'
      );
      return;
    }

    assert.fail('Should not get to this point')
  });

  it('will create the Exchange because it is in the correct numerical formats', async () => {
      let result = await createExchangeBooth("1:2");
      let exchangeBoothAccount = await program.account.exchangeBooth.fetch(result.adminPdaKey);
      assert.equal(exchangeBoothAccount.oracle, '1:2');

      let result2 = await createExchangeBooth("1.0:2.2");
      let exchangeBoothAccount2 = await program.account.exchangeBooth.fetch(result2.adminPdaKey);
      assert.equal(exchangeBoothAccount2.oracle, '1:2.2');

      let result3 = await createExchangeBooth("1.0:2");
      let exchangeBoothAccount3 = await program.account.exchangeBooth.fetch(result3.adminPdaKey);
      assert.equal(exchangeBoothAccount3.oracle, '1:2');

      let result4 = await createExchangeBooth("1:2.2");
      let exchangeBoothAccount4 = await program.account.exchangeBooth.fetch(result4.adminPdaKey);
      assert.equal(exchangeBoothAccount4.oracle, '1:2.2');

      let result5 = await createExchangeBooth(".1:2.2");
      let exchangeBoothAccount5 = await program.account.exchangeBooth.fetch(result5.adminPdaKey);
      assert.equal(exchangeBoothAccount5.oracle, '0.1:2.2');

      let result6 = await createExchangeBooth("2.1:.2");
      let exchangeBoothAccount6 = await program.account.exchangeBooth.fetch(result6.adminPdaKey);
      assert.equal(exchangeBoothAccount6.oracle, '2.1:0.2');
  });

  it('cannot create an exchange booth with mints with two different decimals', async () => {
    let mintA = await createMint(100, 2)
    let mintB = await createMint(250, 3)

    const admin: anchor.web3.Keypair = anchor.web3.Keypair.generate();  

    let [adminPdaKey, _adminPdaBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("ebpda"),
        mintA.mint.publicKey.toBuffer(),
        mintB.mint.publicKey.toBuffer()
      ],
      program.programId
    ));

    let [vaultAPDAKey, _vaultAPDAKeyBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultA"),
        mintA.mint.publicKey.toBuffer(),
      ],
      program.programId
    ));

    let [vaultBPDAKey, _vaultBPDAKeyBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultB"),
        mintB.mint.publicKey.toBuffer(),
      ],
      program.programId
    ));
    
    try {
      await program.methods.create("1:2", 0.025).accounts({
        payer: key,
        admin: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        mintA: mintA.mint.publicKey,
        mintB: mintB.mint.publicKey,
        dataLocation: adminPdaKey,
        vaultAPdaKey: vaultAPDAKey,
        vaultBPdaKey: vaultBPDAKey,
      }).signers([
        admin
      ]).rpc()  
    } catch (error) {
      assert.equal(error.error.errorMessage, 'Decimals of the mints is different.');
      return;
    }

    assert.fail('Should not get to this point')
  });

  it('can deposit into an exchange booth', async () => {   
    let resultCreate = await createExchangeBooth("1:2")

    let transferToAdminOwnedMintAAccount = 15
    let transferToAdminOwnedMintBAccount = 12
    let depositToVaultA = 1
    let depositToVaultB = 2

    await createAssociatedTokenAccountsAndDepositAndAssertCorrectness(
      resultCreate=resultCreate,
      transferToAdminOwnedMintAAccount,
      transferToAdminOwnedMintBAccount,
      depositToVaultA,
      depositToVaultB,
    )
  });

  it('can execute a trade with mint A and wanting mint B and there is a fee that is larger than 1 and was not a fraction', async () => {   
    let resultCreate = await createExchangeBooth("1:2", 10000, 20000, 0.025)

    let transferToAdminOwnedMintAAccount = 5000
    let transferToAdminOwnedMintBAccount = 5000
    let depositToVaultA = 3000
    let depositToVaultB = 3000

    let resultDeposit = await createAssociatedTokenAccountsAndDepositAndAssertCorrectness(
      resultCreate=resultCreate,
      transferToAdminOwnedMintAAccount,
      transferToAdminOwnedMintBAccount,
      depositToVaultA,
      depositToVaultB,
    )

    const otherUser = await createUserAndATAAccountsForMintAandMintB(
      resultCreate.mintA, 
      resultCreate.mintB
    )

    await quickTransfer(resultCreate.mintA.associated_token_account, otherUser.someUserMintA_ATA, 1000, key);
    await quickTransfer(resultCreate.mintB.associated_token_account, otherUser.someUserMintB_ATA, 1000, key);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintA_ATA), 1000);
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultAATA), 2000);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 3000);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintB_ATA), 1000);
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultBATA), 2000);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 3000);

    await program.methods.executeTrade(
      new BN(100, 10),
      resultCreate.mintA.mint.publicKey,
      resultCreate.mintB.mint.publicKey
    ).accounts({
      payer: key,
      systemProgram: anchor.web3.SystemProgram.programId,
      mintA: resultCreate.mintA.mint.publicKey,
      mintB: resultCreate.mintB.mint.publicKey,
      vaultACustomer: otherUser.someUserMintA_ATA,
      vaultBCustomer: otherUser.someUserMintB_ATA,
      dataLocation: resultCreate.adminPdaKey,
      vaultAPda: resultCreate.vaultAPDAKey,
      vaultBPda: resultCreate.vaultBPDAKey,
      admin: resultCreate.admin.publicKey,
      programmId: program.programId,
      customer: otherUser.someUserAccount.publicKey
    }).signers([resultCreate.admin, otherUser.someUserAccount]).rpc()

    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultAATA), 2000); // not touched anymore on trade
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultBATA), 2000); // not touched anymore on trade

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintA_ATA), 900);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 3100);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintB_ATA), 1195);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 2805);
  });

  it('it can execute a trade with mint A and wanting mint B because the fee would be too small', async () => {   
    let resultCreate = await createExchangeBooth("1:2", 100, 250, 0.1)

    let transferToAdminOwnedMintAAccount = 50
    let transferToAdminOwnedMintBAccount = 80
    let depositToVaultA = 20
    let depositToVaultB = 30

    let resultDeposit = await createAssociatedTokenAccountsAndDepositAndAssertCorrectness(
      resultCreate=resultCreate,
      transferToAdminOwnedMintAAccount,
      transferToAdminOwnedMintBAccount,
      depositToVaultA,
      depositToVaultB,
    )

    const otherUser = await createUserAndATAAccountsForMintAandMintB(
      resultCreate.mintA, 
      resultCreate.mintB
    )

    await quickTransfer(resultCreate.mintA.associated_token_account, otherUser.someUserMintA_ATA, 3, key);
    await quickTransfer(resultCreate.mintB.associated_token_account, otherUser.someUserMintB_ATA, 17, key);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintA_ATA), 3);
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultAATA), 30);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 20);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintB_ATA), 17);
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultBATA), 50);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 30);

    try {
      await program.methods.executeTrade(
        new BN(2, 10),
        resultCreate.mintA.mint.publicKey,
        resultCreate.mintB.mint.publicKey
      ).accounts({
        payer: key,
        systemProgram: anchor.web3.SystemProgram.programId,
        mintA: resultCreate.mintA.mint.publicKey,
        mintB: resultCreate.mintB.mint.publicKey,
        vaultACustomer: otherUser.someUserMintA_ATA,
        vaultBCustomer: otherUser.someUserMintB_ATA,
        dataLocation: resultCreate.adminPdaKey,
        vaultAPda: resultCreate.vaultAPDAKey,
        vaultBPda: resultCreate.vaultBPDAKey,
        admin: resultCreate.admin.publicKey,
        programmId: program.programId,
        customer: otherUser.someUserAccount.publicKey
      }).signers([resultCreate.admin, otherUser.someUserAccount]).rpc()
    } catch (error) {
      assert.equal(error.error.errorMessage, 'Fee amount too small.');
      return;
    }

    assert.fail('Should not get to this point')
  });

  it('can execute a trade with mint A and wanting mint B and no fee is included', async () => {   
    let resultCreate = await createExchangeBooth("1:2", 100, 250, 0.0)

    let transferToAdminOwnedMintAAccount = 50
    let transferToAdminOwnedMintBAccount = 80
    let depositToVaultA = 20
    let depositToVaultB = 30

    let resultDeposit = await createAssociatedTokenAccountsAndDepositAndAssertCorrectness(
      resultCreate=resultCreate,
      transferToAdminOwnedMintAAccount,
      transferToAdminOwnedMintBAccount,
      depositToVaultA,
      depositToVaultB,
    )

    const otherUser = await createUserAndATAAccountsForMintAandMintB(
      resultCreate.mintA, 
      resultCreate.mintB
    )

    await quickTransfer(resultCreate.mintA.associated_token_account, otherUser.someUserMintA_ATA, 3, key);
    await quickTransfer(resultCreate.mintB.associated_token_account, otherUser.someUserMintB_ATA, 17, key);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintA_ATA), 3);
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultAATA), 30);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 20);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintB_ATA), 17);
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultBATA), 50);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 30);

    await program.methods.executeTrade(
      new BN(2, 10),
      resultCreate.mintA.mint.publicKey,
      resultCreate.mintB.mint.publicKey
    ).accounts({
      payer: key,
      systemProgram: anchor.web3.SystemProgram.programId,
      mintA: resultCreate.mintA.mint.publicKey,
      mintB: resultCreate.mintB.mint.publicKey,
      vaultACustomer: otherUser.someUserMintA_ATA,
      vaultBCustomer: otherUser.someUserMintB_ATA,
      dataLocation: resultCreate.adminPdaKey,
      vaultAPda: resultCreate.vaultAPDAKey,
      vaultBPda: resultCreate.vaultBPDAKey,
      admin: resultCreate.admin.publicKey,
      programmId: program.programId,
      customer: otherUser.someUserAccount.publicKey
    }).signers([resultCreate.admin, otherUser.someUserAccount]).rpc()

    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultAATA), 30); // not touched anymore on trade
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultBATA), 50); // not touched anymore on trade

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintA_ATA), 1);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 22);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintB_ATA), 21);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 26);
  });

  it('can execute a trade with mint B and wanting mint A', async () => {
    let resultCreate = await createExchangeBooth("1:2")
    
    let transferToAdminOwnedMintAAccount = 50
    let transferToAdminOwnedMintBAccount = 80
    let depositToVaultA = 20
    let depositToVaultB = 30

    let resultDeposit = await createAssociatedTokenAccountsAndDepositAndAssertCorrectness(
      resultCreate=resultCreate,
      transferToAdminOwnedMintAAccount,
      transferToAdminOwnedMintBAccount,
      depositToVaultA,
      depositToVaultB,
    )

    const otherUser = await createUserAndATAAccountsForMintAandMintB(
      resultCreate.mintA, 
      resultCreate.mintB
    )

    await quickTransfer(resultCreate.mintA.associated_token_account, otherUser.someUserMintA_ATA, 3, key);
    await quickTransfer(resultCreate.mintB.associated_token_account, otherUser.someUserMintB_ATA, 17, key);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintA_ATA), 3);
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultAATA), 30);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 20);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintB_ATA), 17);
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultBATA), 50);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 30);

    //1:2
    await program.methods.executeTrade(
      new BN(2, 10),
      resultCreate.mintB.mint.publicKey,
      resultCreate.mintA.mint.publicKey,
    ).accounts({
      payer: key,
      systemProgram: anchor.web3.SystemProgram.programId,
      mintA: resultCreate.mintA.mint.publicKey,
      mintB: resultCreate.mintB.mint.publicKey,
      vaultACustomer: otherUser.someUserMintA_ATA,
      vaultBCustomer: otherUser.someUserMintB_ATA,
      dataLocation: resultCreate.adminPdaKey,
      vaultAPda: resultCreate.vaultAPDAKey,
      vaultBPda: resultCreate.vaultBPDAKey,
      admin: resultCreate.admin.publicKey,
      programmId: program.programId,
      customer: otherUser.someUserAccount.publicKey
    }).signers([resultCreate.admin, otherUser.someUserAccount]).rpc()

    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultAATA), 30); // not touched anymore on trade
    assert.equal(await retrieve_amount_for_ata(resultDeposit.vaultBATA), 50); // not touched anymore on trade

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintA_ATA), 4);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 19);

    assert.equal(await retrieve_amount_for_ata(otherUser.someUserMintB_ATA), 15);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 32);
  });

  it('can fail when you try to deposit with the wrong vault PDAs', async () => {   
    let resultCreate = await createExchangeBooth("1:2")
    
    let vaultAATA = await getAssociatedTokenAddress(
      resultCreate.mintA.mint.publicKey,
      resultCreate.admin.publicKey
    );

    let vaultBATA = await getAssociatedTokenAddress(
      resultCreate.mintB.mint.publicKey,
      resultCreate.admin.publicKey
    );

    const mint_tx2 = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        key, vaultAATA, resultCreate.admin.publicKey, resultCreate.mintA.mint.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        key, vaultBATA, resultCreate.admin.publicKey, resultCreate.mintB.mint.publicKey
      )
    );

    await anchor.AnchorProvider.env().sendAndConfirm(mint_tx2, []);

    await quickTransfer(resultCreate.mintA.associated_token_account, vaultAATA, 15, key);
    await quickTransfer(resultCreate.mintB.associated_token_account, vaultBATA, 12, key);

    assert.equal(await retrieve_amount_for_ata(vaultAATA), 15);
    assert.equal(await retrieve_amount_for_ata(vaultBATA), 12);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 0);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 0);

    let [fakeVaultAPDAKey, _fakeVaultABump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVault"),
        resultCreate.mintA.mint.publicKey.toBuffer(),
      ],
      anchor.web3.SystemProgram.programId // not using the program id but the System Program Id
    ));

    let [fakeVaultBPDAKey, _fakeVaultBBump] = (await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("EBVaultB"),
        resultCreate.mintB.mint.publicKey.toBuffer(),
      ],
      anchor.web3.SystemProgram.programId // not using the program id but the System Program Id
    ));

    try {
      await program.methods.deposit(new BN(1, 10), new BN(2, 10)).accounts({
        payer: key,
        systemProgram: anchor.web3.SystemProgram.programId,
        mintA: resultCreate.mintA.mint.publicKey,
        mintB: resultCreate.mintB.mint.publicKey,
        vaultATransferOutOf: vaultAATA,
        vaultBTransferOutOf: vaultBATA,
        dataLocation: resultCreate.adminPdaKey,
        vaultAPda: fakeVaultAPDAKey,
        vaultBPda: resultCreate.vaultBPDAKey,
        admin: resultCreate.admin.publicKey,
        programmId: program.programId,
      }).signers([resultCreate.admin]).rpc()
      assert.fail('The instruction should have failed because vault A PDA was incorrect.');
    } catch (error) {
      assert.equal(error.error.errorMessage, 'Vault A key is incorrect.');
    }

    try {
      await program.methods.deposit(new BN(1, 10), new BN(2, 10)).accounts({
        payer: key,
        systemProgram: anchor.web3.SystemProgram.programId,
        mintA: resultCreate.mintA.mint.publicKey,
        mintB: resultCreate.mintB.mint.publicKey,
        vaultATransferOutOf: vaultAATA,
        vaultBTransferOutOf: vaultBATA,
        dataLocation: resultCreate.adminPdaKey,
        vaultAPda: resultCreate.vaultAPDAKey,
        vaultBPda: fakeVaultBPDAKey,
        admin: resultCreate.admin.publicKey,
        programmId: program.programId,
      }).signers([resultCreate.admin]).rpc()
      assert.fail('The instruction should have failed because vault B PDA was incorrect.');
    } catch (error) {
      assert.equal(error.error.errorMessage, 'Vault B key is incorrect.');
    }

    try {
      // Swap the vault PDAs
      await program.methods.deposit(new BN(1, 10), new BN(2, 10)).accounts({
        payer: key,
        systemProgram: anchor.web3.SystemProgram.programId,
        mintA: resultCreate.mintA.mint.publicKey,
        mintB: resultCreate.mintB.mint.publicKey,
        vaultATransferOutOf: vaultAATA,
        vaultBTransferOutOf: vaultBATA,
        dataLocation: resultCreate.adminPdaKey,
        vaultAPda: resultCreate.vaultBPDAKey,
        vaultBPda: resultCreate.vaultAPDAKey,
        admin: resultCreate.admin.publicKey,
        programmId: program.programId,
      }).signers([resultCreate.admin]).rpc()
      assert.fail('The instruction should have failed because vault A PDA was incorrect.');
    } catch (error) {
      assert.equal(error.error.errorMessage, 'Vault A key is incorrect.');
    }
  });

  it('can create super simple account', async () => {
    const data_location: anchor.web3.Keypair = anchor.web3.Keypair.generate();  

    await program.methods.superSimple("hi there").accounts({
        admin: key,
        dataLocation: data_location.publicKey,
      }).signers([
        data_location
      ]).rpc();
      
      
    const tweetAccount = await program.account.superSimpleSave.fetch(data_location.publicKey);
    
    assert.equal(tweetAccount.callCount, 59);
    assert.equal(tweetAccount.message, "hi there");
  });

  async function createUserAndATAAccountsForMintAandMintB(mintA, mintB) {
    const someUserAccount: anchor.web3.Keypair = anchor.web3.Keypair.generate();  
    let signature = await program.provider.connection.requestAirdrop(
      someUserAccount.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await program.provider.connection.confirmTransaction(signature);

    let someUserMintA_ATA = await getAssociatedTokenAddress(
      mintA.mint.publicKey,
      someUserAccount.publicKey
    );

    let someUserMintB_ATA = await getAssociatedTokenAddress(
      mintB.mint.publicKey,
      someUserAccount.publicKey
    );

    const mint_tx3 = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        someUserAccount.publicKey, someUserMintA_ATA, someUserAccount.publicKey, mintA.mint.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        someUserAccount.publicKey, someUserMintB_ATA, someUserAccount.publicKey, mintB.mint.publicKey
      )
    );

    await anchor.AnchorProvider.env().sendAndConfirm(mint_tx3, [someUserAccount]);

    assert.equal(await retrieve_amount_for_ata(someUserMintA_ATA), 0);
    assert.equal(await retrieve_amount_for_ata(someUserMintB_ATA), 0);

    return {
      someUserAccount: someUserAccount,
      someUserMintA_ATA: someUserMintA_ATA,
      someUserMintB_ATA: someUserMintB_ATA
    }
  }

  async function createMint(amount, decimals=6) {
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
        mintKey.publicKey, decimals, key, key
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

  async function createExchangeBooth(oracle, mintAmount = 100, mintBAmount = 250, fee = 0.0) {
    let mintA = await createMint(mintAmount)
    let mintB = await createMint(mintBAmount)

    const admin: anchor.web3.Keypair = anchor.web3.Keypair.generate();  

    let [adminPdaKey, adminPdaBump] = (await PublicKey.findProgramAddress(
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
    
    await program.methods.create(oracle, fee).accounts({
      payer: key,
      admin: admin.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      mintA: mintA.mint.publicKey,
      mintB: mintB.mint.publicKey,
      dataLocation: adminPdaKey,
      vaultAPdaKey: vaultAPDAKey,
      vaultBPdaKey: vaultBPDAKey,
    }).signers([
      admin
    ]).rpc()  

    return {
      mintA: mintA,
      mintB: mintB,
      admin: admin,
      adminPdaKey: adminPdaKey,
      adminPdaBump: adminPdaBump,
      vaultAPDAKey: vaultAPDAKey,
      vaultBPDAKey: vaultBPDAKey
    }
  }

  async function createAssociatedTokenAccountsAndDepositAndAssertCorrectness(
    resultCreate,
    transferToAdminOwnedMintAAccount,
    transferToAdminOwnedMintBAccount,
    depositToVaultA,
    depositToVaultB,
  ) {
    let vaultAATA = await getAssociatedTokenAddress(
      resultCreate.mintA.mint.publicKey,
      resultCreate.admin.publicKey
    );

    let vaultBATA = await getAssociatedTokenAddress(
      resultCreate.mintB.mint.publicKey,
      resultCreate.admin.publicKey
    );

    const mint_tx2 = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        key, vaultAATA, resultCreate.admin.publicKey, resultCreate.mintA.mint.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        key, vaultBATA, resultCreate.admin.publicKey, resultCreate.mintB.mint.publicKey
      )
    );

    await anchor.AnchorProvider.env().sendAndConfirm(mint_tx2, []);

    await quickTransfer(resultCreate.mintA.associated_token_account, vaultAATA, transferToAdminOwnedMintAAccount, key);
    await quickTransfer(resultCreate.mintB.associated_token_account, vaultBATA, transferToAdminOwnedMintBAccount, key);

    assert.equal(await retrieve_amount_for_ata(vaultAATA), transferToAdminOwnedMintAAccount);
    assert.equal(await retrieve_amount_for_ata(vaultBATA), transferToAdminOwnedMintBAccount);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), 0);
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), 0);

    await program.methods.deposit(
      new BN(depositToVaultA, 10), 
      new BN(depositToVaultB, 10)).accounts({
      payer: key,
      systemProgram: anchor.web3.SystemProgram.programId,
      mintA: resultCreate.mintA.mint.publicKey,
      mintB: resultCreate.mintB.mint.publicKey,
      vaultATransferOutOf: vaultAATA,
      vaultBTransferOutOf: vaultBATA,
      dataLocation: resultCreate.adminPdaKey,
      vaultAPda: resultCreate.vaultAPDAKey,
      vaultBPda: resultCreate.vaultBPDAKey,
      admin: resultCreate.admin.publicKey,
      programmId: program.programId,
    }).signers([resultCreate.admin]).rpc()

    assert.equal(await retrieve_amount_for_ata(vaultAATA), (transferToAdminOwnedMintAAccount-depositToVaultA));
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultAPDAKey), depositToVaultA);

    assert.equal(await retrieve_amount_for_ata(vaultBATA), (transferToAdminOwnedMintBAccount-depositToVaultB));
    assert.equal(await retrieve_amount_for_ata(resultCreate.vaultBPDAKey), depositToVaultB);
    
    return {
      vaultAATA: vaultAATA,
      vaultBATA: vaultBATA
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



