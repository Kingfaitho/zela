/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ajo.json`.
 */
export type Ajo = {
  "address": "DHhqgD4WSanbkFZHPgxM4oSmodn5f24Jw1pyzX7sZcfA",
  "metadata": {
    "name": "ajo",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "contribute",
      "discriminator": [
        82,
        33,
        68,
        131,
        32,
        0,
        205,
        95
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "group",
          "writable": true
        },
        {
          "name": "memberAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  106,
                  111,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "group"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "memberTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "member"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "groupVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "group"
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createGroup",
      "discriminator": [
        79,
        60,
        158,
        134,
        61,
        199,
        56,
        248
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "group",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  106,
                  111,
                  95,
                  103,
                  114,
                  111,
                  117,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "admin"
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "contributionAmount",
          "type": "u64"
        },
        {
          "name": "maxMembers",
          "type": "u8"
        },
        {
          "name": "roundDurationDays",
          "type": "u8"
        },
        {
          "name": "groupType",
          "type": "u8"
        },
        {
          "name": "securityDepositMultiplier",
          "type": "u8"
        }
      ]
    },
    {
      "name": "distributeRound",
      "discriminator": [
        35,
        208,
        142,
        224,
        180,
        109,
        12,
        34
      ],
      "accounts": [
        {
          "name": "caller",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "group",
          "writable": true
        },
        {
          "name": "recipientMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  106,
                  111,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "group"
              },
              {
                "kind": "account",
                "path": "recipient"
              }
            ]
          }
        },
        {
          "name": "recipient"
        },
        {
          "name": "groupVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "group"
              }
            ]
          }
        },
        {
          "name": "recipientTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "recipient"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinGroup",
      "discriminator": [
        121,
        56,
        199,
        19,
        250,
        70,
        44,
        184
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "group",
          "writable": true
        },
        {
          "name": "memberAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  106,
                  111,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "group"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "memberTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "member"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "groupVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "group"
              }
            ]
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "raiseEmergency",
      "discriminator": [
        204,
        176,
        34,
        162,
        100,
        39,
        170,
        21
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "group"
        },
        {
          "name": "memberAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  106,
                  111,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "group"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "emergency",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  101,
                  114,
                  103,
                  101,
                  110,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "group"
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "voteEmergency",
      "discriminator": [
        84,
        147,
        178,
        77,
        217,
        97,
        38,
        174
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "group"
        },
        {
          "name": "voterMember",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  106,
                  111,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "group"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "emergency",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "approve",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ajoGroup",
      "discriminator": [
        205,
        236,
        137,
        105,
        137,
        38,
        51,
        219
      ]
    },
    {
      "name": "ajoMember",
      "discriminator": [
        209,
        123,
        99,
        124,
        0,
        147,
        55,
        202
      ]
    },
    {
      "name": "emergencyRequest",
      "discriminator": [
        136,
        75,
        174,
        227,
        218,
        157,
        204,
        58
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nameTooLong",
      "msg": "Group name too long"
    },
    {
      "code": 6001,
      "name": "invalidMemberCount",
      "msg": "Member count must be between 2 and 50"
    },
    {
      "code": 6002,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6003,
      "name": "invalidDuration",
      "msg": "Duration must be at least 1 day"
    },
    {
      "code": 6004,
      "name": "groupNotOpen",
      "msg": "Group is not open for new members"
    },
    {
      "code": 6005,
      "name": "groupFull",
      "msg": "Group is full"
    },
    {
      "code": 6006,
      "name": "groupNotActive",
      "msg": "Group is not active"
    },
    {
      "code": 6007,
      "name": "roundDeadlinePassed",
      "msg": "Round deadline has passed"
    },
    {
      "code": 6008,
      "name": "roundNotReady",
      "msg": "Round is not ready for distribution"
    },
    {
      "code": 6009,
      "name": "alreadyReceived",
      "msg": "Member has already received their round"
    },
    {
      "code": 6010,
      "name": "emergencyResolved",
      "msg": "Emergency request already resolved"
    },
    {
      "code": 6011,
      "name": "reasonTooLong",
      "msg": "Reason too long"
    },
    {
      "code": 6012,
      "name": "mathOverflow",
      "msg": "Math overflow"
    }
  ],
  "types": [
    {
      "name": "ajoGroup",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "contributionAmount",
            "type": "u64"
          },
          {
            "name": "maxMembers",
            "type": "u8"
          },
          {
            "name": "currentMembers",
            "type": "u8"
          },
          {
            "name": "currentRound",
            "type": "u32"
          },
          {
            "name": "totalRounds",
            "type": "u8"
          },
          {
            "name": "roundDurationDays",
            "type": "u8"
          },
          {
            "name": "groupType",
            "type": "u8"
          },
          {
            "name": "securityDepositMultiplier",
            "type": "u8"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "nextRoundAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ajoMember",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "group",
            "type": "pubkey"
          },
          {
            "name": "position",
            "type": "u8"
          },
          {
            "name": "securityDeposit",
            "type": "u64"
          },
          {
            "name": "totalContributed",
            "type": "u64"
          },
          {
            "name": "hasReceived",
            "type": "bool"
          },
          {
            "name": "missedPayments",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "emergencyRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "group",
            "type": "pubkey"
          },
          {
            "name": "requester",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "votesYes",
            "type": "u32"
          },
          {
            "name": "votesNo",
            "type": "u32"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
