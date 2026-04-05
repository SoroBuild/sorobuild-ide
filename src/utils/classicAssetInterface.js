const classicInterface = [
  {
    name: "balance",
    inputs: [{ name: "id", type: "Address" }],
    returns: "u128",
    description: "Get balance of an account",
  },
  {
    name: "transfer",
    inputs: [
      { name: "from", type: "Address" },
      { name: "to", type: "Address" },
      { name: "amount", type: "u128" },
    ],
    returns: "void",
    description: "Transfer tokens",
  },
  {
    name: "transfer_from",
    inputs: [
      { name: "spender", type: "Address" },
      { name: "from", type: "Address" },
      { name: "to", type: "Address" },
      { name: "amount", type: "u128" },
    ],
    returns: "void",
    description: "Transfer tokens on behalf",
  },
  {
    name: "approve",
    inputs: [
      { name: "from", type: "Address" },
      { name: "spender", type: "Address" },
      { name: "amount", type: "u128" },
    ],
    returns: "void",
    description: "Approve spender",
  },
  {
    name: "allowance",
    inputs: [
      { name: "from", type: "Address" },
      { name: "spender", type: "Address" },
    ],
    returns: "u128",
    description: "Get allowance for spender",
  },
  {
    name: "mint",
    inputs: [
      { name: "to", type: "Address" },
      { name: "amount", type: "u128" },
    ],
    returns: "void",
    description: "Mint new tokens (issuer only)",
  },
  {
    name: "burn",
    inputs: [
      { name: "from", type: "Address" },
      { name: "amount", type: "u128" },
    ],
    returns: "void",
    description: "Burn tokens (issuer only)",
  },
  {
    name: "clawback",
    inputs: [
      { name: "from", type: "Address" },
      { name: "amount", type: "u128" },
    ],
    returns: "void",
    description: "Claw back tokens (issuer only, if enabled)",
  },
  {
    name: "set_admin",
    inputs: [{ name: "new_admin", type: "Address" }],
    returns: "void",
    description: "Set new admin address",
  },
  {
    name: "admin",
    inputs: [],
    returns: "Address",
    description: "Get admin address",
  },
  {
    name: "decimals",
    inputs: [],
    returns: "u32",
    description: "Get decimal precision",
  },
  {
    name: "name",
    inputs: [],
    returns: "string",
    description: "Get token name",
  },
  {
    name: "symbol",
    inputs: [],
    returns: "string",
    description: "Get token symbol",
  },
];

export default classicInterface;
