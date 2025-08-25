import {
  createMeeClient,
  getMeeScanLink,
  getMEEVersion,
  greaterThanOrEqualTo,
  MEEVersion,
  runtimeERC20BalanceOf,
  toMultichainNexusAccount,
  type Url,
  waitForSupertransactionReceipt,
} from "@biconomy/abstractjs";
import { createPublicClient, defineChain, erc20Abi, type Hex, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";

// Read the .env file
config();

// Define constants with mainnet addresses
const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const AAVE = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const aUSDC = "0xbcca60bb61934080951369a648fb03df4f96263c";

// Define local (anvil) network
export const localNet = defineChain({
  id: 1,
  name: "LocalNetwork",
  nativeCurrency: {
    name: "LocalNetwork",
    symbol: "LLL",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.RPC_URL!],
    },
  },
});

// Connect the EOA
const eoa = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);

// Initiate a multichain nexus with only one chain
const orchestrator = await toMultichainNexusAccount({
  chainConfigurations: [
    {
      chain: localNet,
      transport: http(process.env.RPC_URL),
      version: getMEEVersion(MEEVersion.V2_1_0),
    },
  ],
  signer: eoa,
});

// Approve token transfer from nexus to AAVE
const approveAAVEInstruction = await orchestrator.buildComposable({
  type: "approve",
  data: {
    // use the whole available balance
    amount: runtimeERC20BalanceOf({
      targetAddress: orchestrator.addressOn(localNet.id)!,
      tokenAddress: USDC,
      constraints: [greaterThanOrEqualTo(1n)],
    }),
    chainId: localNet.id,
    spender: AAVE,
    tokenAddress: USDC,
  },
});

// a little bit of magic to describe custom function
const aaveSupplyAbi = parseAbi([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
]);

// Call `supply` function that will transfer tokens from nexus to AAVE
// inspired by
// https://docs.biconomy.io/new/examples/single-sig-approve-execute#single-signature-approve-execute
const callAAVEInstruction = await orchestrator.buildComposable({
  type: "default",
  data: {
    abi: aaveSupplyAbi,
    chainId: localNet.id,
    functionName: "supply",
    to: AAVE,
    args: [
      USDC,
      // use the whole available balance
      runtimeERC20BalanceOf({
        targetAddress: orchestrator.addressOn(localNet.id)!,
        tokenAddress: USDC,
        constraints: [greaterThanOrEqualTo(1n)],
      }),
      orchestrator.addressOn(localNet.id),
      0,
    ],
  },
});

// Call `withdrawal` function that will transfer tokens from nexus to my EOA
// inspired by
// https://docs.biconomy.io/new/integration-guides/bridges-and-solvers/integrate-across#best-practices
const withdrawInstruction = await orchestrator.buildComposable({
  type: "withdrawal",
  data: {
    // use the whole available balance
    amount: runtimeERC20BalanceOf({
      targetAddress: orchestrator.addressOn(localNet.id)!,
      tokenAddress: aUSDC,
      constraints: [greaterThanOrEqualTo(1n)],
    }),
    chainId: localNet.id,
    tokenAddress: aUSDC,
  },
});

// Initialize MEE client
const meeClient = await createMeeClient({
  account: orchestrator,
  url: process.env.MEE_URL as Url,
});

// Create a fusion quote
const fusionQuote = await meeClient.getFusionQuote({
  // Initiate the flow by transferring tokens from AOE to Multichain Nexus
  trigger: {
    // 10 USDC
    amount: 10_000_000n,
    chainId: localNet.id,
    tokenAddress: USDC,
  },
  // Execute all instructions
  instructions: [approveAAVEInstruction, callAAVEInstruction, withdrawInstruction],
  // Pay gas in USDC
  feeToken: {
    chainId: localNet.id,
    address: USDC,
  },
  // Cleanup if something went wrong
  cleanUps: [
    {
      chainId: localNet.id,
      recipientAddress: eoa.address,
      tokenAddress: USDC,
    },
  ],
});

// Execute quote
const { hash } = await meeClient.executeFusionQuote({ fusionQuote });

// Wait for 2 blocks of confirmation
await waitForSupertransactionReceipt(meeClient, {
  hash,
  confirmations: 2,
});

console.info(getMeeScanLink(hash));

// Create viem client because MEE client does not show balance
const client = createPublicClient({
  chain: localNet,
  transport: http(process.env.RPC_URL),
});

// Get balance of the EOA
const balance = await client.readContract({
  address: aUSDC,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [eoa.address],
});

// Display it
console.info(balance);
