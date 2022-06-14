const { readFile } = require("mz/fs");
const {
  Connection,
  sendAndConfirmTransaction,
  Keypair,
  Transaction,
  SystemProgram,
  PublicKey,
  TransactionInstruction,
} = require("@solana/web3.js");
const {struct, u8, u32, ns64, s32, nu64} = require("@solana/buffer-layout");
const BN = require("bn.js");

const { deserialize, serialize } = require('borsh');

class Assignable {
  constructor(properties) {
    Object.keys(properties).forEach((key) => {
      this[key] = properties[key];
    });
  }

  encode() {
    return serialize(SCHEMA, this);
  }
}

class EchoMessage extends Assignable {
  static decode(bytes) {
    const dataLengthBuffer = Buffer.alloc(4);
    bytes.copy(dataLengthBuffer, 0, 0, 4);

    const dataLength = DataLength.decode(dataLengthBuffer);

    const accountDataBuffer = Buffer.alloc(dataLength.length);
    bytes.copy(accountDataBuffer, 0, 4, dataLength.length+4);
    return deserialize(SCHEMA, EchoMessage, accountDataBuffer);
  }
}

class AuthorizedEchoMessage extends Assignable {
  static decode(bytes) {
    const dataLengthBuffer = Buffer.alloc(4);
    bytes.copy(dataLengthBuffer, 0, 0, 4);

    const dataLength = DataLength.decode(dataLengthBuffer);

    const accountDataBuffer = Buffer.alloc(dataLength.length);
    bytes.copy(accountDataBuffer, 0, 4, dataLength.length+4);

    return deserialize(SCHEMA, AuthorizedEchoMessage, accountDataBuffer);
  }
}

class DataLength extends Assignable {
  static decode(bytes) {
    return deserialize(SCHEMA, DataLength, bytes);
  }
}

class EchoMessageSubmission extends Assignable {
  static decode(bytes) {
    return deserialize(SCHEMA, DataLength, bytes);
  }
}

const SCHEMA = new Map([
  [
    EchoMessage,
    {
      kind: 'struct',
      fields: [
        ['call_count', 'u64'],
        ['echo_message', 'string'],
      ],
    },
  ],
  [
  EchoMessageSubmission,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u64'],
        ['echo_message', 'string'],
      ],
    },
  ],
  [DataLength, { kind: 'struct', fields: [['length', 'u32']] }],
  [
    AuthorizedEchoMessage,
    {
      kind: 'struct',
      fields: [
        ['bump_seed', 'u8'],
        ['buffer_seed', 'u8'],
        ['call_count', 'u64'],
        ['message', 'string']
      ],
    },
  ],
]);

const main = async () => {
  var args = process.argv.slice(2);
  // args[0]: Program ID
  // args[1]: Is Auth Echo
  // args[2] (Optional): Counter buffer account
  // args[3] (Optional): Payer
  const programId = new PublicKey(args[0])
  const instruction = args[1]
  const locationOfKey = args[2]
  const accountToWriteTo = args[3]

  console.log('account='+accountToWriteTo)
  console.log(programId.toBase58());
  const connection = new Connection("https://api.devnet.solana.com/");

  let feePayer = new Keypair();
  if (locationOfKey != undefined) {
    secretKeyString = await readFile(locationOfKey, {
      encoding: "utf8",
    });
    console.log("Loaded Keypair from ", locationOfKey);
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    feePayer = Keypair.fromSecretKey(secretKey);
    console.log("Requesting Airdrop of 1 SOL...");
    await connection.requestAirdrop(feePayer.publicKey, 2e9);
    console.log("Airdrop received");
  } else {
    console.log("Requesting Airdrop of 1 SOL...");
    await connection.requestAirdrop(feePayer.publicKey, 2e9);
    console.log("Airdrop received");
  }

  const counter = new Keypair();
  let counterKey = counter.publicKey;
  let tx = new Transaction();
  let signers = [feePayer];
  if (accountToWriteTo != undefined) {
    console.log("Found counter address");
    counterKey = new PublicKey(accountToWriteTo);
  } else {
    console.log("Generating new counter address");
    let createIx = SystemProgram.createAccount({
      fromPubkey: feePayer.publicKey,
      newAccountPubkey: counterKey,
      /** Amount of lamports to transfer to the created account */
      lamports: await connection.getMinimumBalanceForRentExemption(10000),
      /** Amount of space in bytes to allocate to the created account */
      space: 10000,
      /** Public key of the program to assign as the owner of the created account */
      programId: programId,
    });
    signers.push(counter);
    tx.add(createIx);
  }

  let buffer_seed = 67
  let message = "4444"
  var data = create_data(instruction, buffer_seed, message)

  const authKey = (await PublicKey.findProgramAddress(
    [Buffer.from("authority"), feePayer.publicKey.toBuffer(), Buffer.from([buffer_seed])],
    programId
  ))[0];

  console.log('auth key={}', authKey)

  let incrIx = new TransactionInstruction({
    keys: [
      {
        pubkey: counterKey,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: feePayer.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: authKey,
        isSigner: false,
        isWritable: false,
      }
    ],
    programId: programId,
    data: data,
  });
  /*
    TransactionInstruction({
      keys: Array<AccountMeta>,
      programId: PublicKey,
      data: Buffer,
    });
  */
  tx.add(incrIx);

  let txid = await sendAndConfirmTransaction(connection, tx, signers, {
    skipPreflight: true,
    preflightCommitment: "confirmed",
    confirmation: "confirmed",
  });
  console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`);

  data = (await connection.getAccountInfo(counterKey)).data;

  if (instruction == 0 || instruction == 1) {
    let output = EchoMessage.decode(data)
    console.log("Call count: ", output.call_count.toNumber())
    console.log("Message: ", output.echo_message)
    console.log("Counter Key: ", counterKey.toBase58());
  }
  
  if (instruction == 2 || instruction == 3) {
    let output = AuthorizedEchoMessage.decode(data)
    console.log("Call count: ", output.call_count)
    console.log("Buffer Seed: ", output.buffer_seed)
    console.log("Message: ", output.message)
    console.log("Counter Key: ", counterKey.toBase58());
  }
};

function create_data(instruction, buffer_seed, message) {
  var data;
  if (instruction == 0) {
    data = echo_message(message)
  }

  if (instruction == 1) {
    data = echo_message_delete()
  }

  if (instruction == 2) {
    data = auth_echo_message_initialize(buffer_seed, message)
  }

  if (instruction == 3) {
    data = auth_echo_message(message)
  }

  return data
}

function auth_echo_message_initialize(buffer_seed, message) {
  let params = {buffer_seed: buffer_seed};
  let allocateStruct = {
    index: 2,
    layout: struct([
      u8('instruction'),
      u8('buffer_seed')
    ])
  };
  let data = Buffer.alloc(allocateStruct.layout.span);
  let layoutFields = Object.assign({instruction: allocateStruct.index}, params);
  allocateStruct.layout.encode(layoutFields, data)
  data = Buffer.concat([data, Buffer.from(message)]);
  return data
} 

function auth_echo_message(message) {
  let allocateStruct = {
    index: 3,
    layout: struct([
      u8('instruction')
    ])
  };
  let data = Buffer.alloc(allocateStruct.layout.span);
  let layoutFields = Object.assign({instruction: allocateStruct.index});
  allocateStruct.layout.encode(layoutFields, data)
  data = Buffer.concat([data, Buffer.from(message)]);
  return data
} 

function echo_message(message) {
  let allocateStruct = {
    index: 0,
    layout: struct([
      u8('instruction')
    ])
  };
  let data = Buffer.alloc(allocateStruct.layout.span);
  let layoutFields = Object.assign({instruction: allocateStruct.index});
  allocateStruct.layout.encode(layoutFields, data)
  data = Buffer.concat([data, Buffer.from(message)]);
  return data
}

function echo_message_delete() {
  let allocateStruct = {
    index: 1,
    layout: struct([
      u8('instruction')
    ])
  };
  let data = Buffer.alloc(allocateStruct.layout.span);
  let layoutFields = Object.assign({instruction: allocateStruct.index});
  allocateStruct.layout.encode(layoutFields, data)
  return data
}

main()
  .then(() => {
    console.log("Success");
  })
  .catch((e) => {
    console.error(e);
  });
