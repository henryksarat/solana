export const RandomIdl = {
  "version": "0.1.0",
  "name": "booth_exchange",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [],
      "args": []
    },
    {
      "name": "create",
      "accounts": [
        {
          "name": "dataLocation",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultAPdaKey",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultBPdaKey",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "oracleData",
          "type": "string"
        },
        {
          "name": "fee",
          "type": "f32"
        }
      ]
    },
    {
      "name": "superSimple",
      "accounts": [
        {
          "name": "dataLocation",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "dataLocation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultATransferOutOf",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultBTransferOutOf",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultBPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "programmId",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "vaultADepositAmount",
          "type": "u64"
        },
        {
          "name": "vaultBDepositAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "executeTrade",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "dataLocation",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintA",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintB",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultACustomer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultBCustomer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultAPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultBPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "customer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "programmId",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "currentMint",
          "type": "publicKey"
        },
        {
          "name": "mintToGet",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ExchangeBooth",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "mintA",
            "type": "publicKey"
          },
          {
            "name": "mintB",
            "type": "publicKey"
          },
          {
            "name": "vaultA",
            "type": "publicKey"
          },
          {
            "name": "vaultB",
            "type": "publicKey"
          },
          {
            "name": "oracle",
            "type": "string"
          },
          {
            "name": "programId",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "fee",
            "type": "f32"
          }
        ]
      }
    },
    {
      "name": "SuperSimpleSave",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "callCount",
            "type": "i32"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "VaultAIncorrect",
      "msg": "Vault A key is incorrect."
    },
    {
      "code": 6001,
      "name": "VaultBIncorrect",
      "msg": "Vault B key is incorrect."
    },
    {
      "code": 6002,
      "name": "MintNotSupported",
      "msg": "Mint not supported."
    },
    {
      "code": 6003,
      "name": "DecimalsBetweenMintsIsNotTheSame",
      "msg": "Decimals of the mints is different."
    },
    {
      "code": 6004,
      "name": "OracleErrorLeftFormat",
      "msg": "Left exchange rate is in the incorrect format in the Oracle."
    },
    {
      "code": 6005,
      "name": "OracleErrorRightFormat",
      "msg": "Right exchange rate is in the incorrect format in the Oracle."
    },
    {
      "code": 6006,
      "name": "OracleErrorFormat",
      "msg": "Format of the exchange rate in the oracle is incorrect."
    },
    {
      "code": 6007,
      "name": "FeeAmountTooSmall",
      "msg": "Fee amount too small."
    }
  ]
};