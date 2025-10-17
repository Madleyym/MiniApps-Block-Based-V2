// Contract addresses on Base Mainnet
export const CONTRACTS = {
  ADVENTURE: "0x53666b780ba487386fc53c78a7fd4af1089782ff" as const,
  CLASSIC: "0x50280E0aE6157dE214bd38298D25341F1FADB993" as const,
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
  GM: "0xf5b0E9cFD956929cFB2F168667CC392c29163535",
} as const;

export const DEVELOPER_WALLET =
  "0xAeabadae3Cc5f1d1A5De4903a195BF2796dF3481" as const;

export const OPERATOR_WALLET =
  "0x07dce223775f17d6d09dbc3241b488cbb1e6ce9f" as const;

// Import ABIs
import BlockBasedAdventureABI from "./abi/BlockBasedAdventure.json";
import BlockBasedClassicABI from "./abi/BlockBasedClassic.json";
import DailyGMABI from "./abi/DailyGM.json";
export const ABIS = {
  ADVENTURE: BlockBasedAdventureABI,
  CLASSIC: BlockBasedClassicABI,
  GM: DailyGMABI,
} as const;

// USDC ABI (minimal for approve/transfer)
export const USDC_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;
