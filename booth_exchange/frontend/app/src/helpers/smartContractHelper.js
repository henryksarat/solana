import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, clusterApiUrl, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import idl from '../idl.json';
import {
    createMint,
    TOKEN_PROGRAM_ID,
    getOrCreateAssociatedTokenAccount,
    getAssociatedTokenAddress,
    mintTo,
    getAccount,
    transfer,
  } from "@solana/spl-token"; 

const programID = new PublicKey("BR6rCBaWFS1DS3U9MirWBFDjJ2NEBWgrPGTkLCCrgju8");

const { SystemProgram } = web3;

async function getProvider(opts, wallet) {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    // const network = "http://127.0.0.1:8899";
    // const connection = new Connection(network, opts.preflightCommitment);

    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }


async function superSimple(text, dataLocationPublicKey, adminPublicKey, signer, program) {
    try {
      await program.rpc.initialize();
      let result = await program.rpc.superSimple(text, {
        accounts: {
          dataLocation: dataLocationPublicKey,
          admin: adminPublicKey,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        signers: [signer]
      });
    } catch (err) {
        console.log("Transaction error: ", err);
    }

    return await program.account.superSimpleSave.fetch(signer.publicKey);
}

export {superSimple}