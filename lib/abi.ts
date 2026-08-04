export const accrueAbi = [
  {
    type: "function",
    name: "createStream",
    stateMutability: "nonpayable",
    inputs: [
      { name: "receiver", type: "address" },
      { name: "depositAmount", type: "uint256" },
      { name: "ratePerSecond", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" }
    ],
    outputs: [{ name: "streamId", type: "uint256" }]
  },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "streamId", type: "uint256" }], outputs: [] },
  { type: "function", name: "claimAll", stateMutability: "nonpayable", inputs: [{ name: "streamIds", type: "uint256[]" }], outputs: [] },
  { type: "function", name: "pauseStream", stateMutability: "nonpayable", inputs: [{ name: "streamId", type: "uint256" }], outputs: [] },
  { type: "function", name: "resumeStream", stateMutability: "nonpayable", inputs: [{ name: "streamId", type: "uint256" }], outputs: [] },
  { type: "function", name: "addFunds", stateMutability: "nonpayable", inputs: [{ name: "streamId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "cancelStream", stateMutability: "nonpayable", inputs: [{ name: "streamId", type: "uint256" }], outputs: [] },
  {
    type: "function",
    name: "getStream",
    stateMutability: "view",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{
      type: "tuple",
      components: [
        { name: "sender", type: "address" },
        { name: "receiver", type: "address" },
        { name: "depositedAmount", type: "uint128" },
        { name: "claimedAmount", type: "uint128" },
        { name: "ratePerSecond", type: "uint96" },
        { name: "startTime", type: "uint40" },
        { name: "endTime", type: "uint40" },
        { name: "lastStateChange", type: "uint40" },
        { name: "totalPausedDuration", type: "uint40" },
        { name: "pausedAt", type: "uint40" },
        { name: "paused", type: "bool" },
        { name: "cancelled", type: "bool" }
      ]
    }]
  },
  { type: "function", name: "getAccruedAmount", stateMutability: "view", inputs: [{ name: "streamId", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getClaimableAmount", stateMutability: "view", inputs: [{ name: "streamId", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getRefundableAmount", stateMutability: "view", inputs: [{ name: "streamId", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getSenderStreams", stateMutability: "view", inputs: [{ name: "sender", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { type: "function", name: "getReceiverStreams", stateMutability: "view", inputs: [{ name: "receiver", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { type: "event", name: "StreamCreated", inputs: [{ indexed: true, name: "streamId", type: "uint256" }, { indexed: true, name: "sender", type: "address" }, { indexed: true, name: "receiver", type: "address" }, { indexed: false, name: "depositedAmount", type: "uint256" }, { indexed: false, name: "ratePerSecond", type: "uint256" }, { indexed: false, name: "startTime", type: "uint256" }, { indexed: false, name: "endTime", type: "uint256" }] }
] as const;

export const erc20Abi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] }
] as const;
