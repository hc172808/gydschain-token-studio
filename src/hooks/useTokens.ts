import { useState, useEffect, useCallback, useRef } from "react";
import type { DeployedToken, Transaction } from "@/lib/blockchain/types";
import type { EthereumProvider } from "@/lib/blockchain/walletAdapter";
import { activeConfig, getActiveConfig } from "@/lib/blockchain/config";
import { toast } from "sonner";
import {
  deployERC20,
  getTransactionReceipt,
  encodeBurnCall,
  encodeSwapCall,
} from "@/lib/blockchain/erc20Factory";
import { sendTransaction } from "@/lib/blockchain/walletAdapter";
import {
  fetchTokens,
  fetchTransactions,
  createToken,
  createTransaction,
  dbTokenToDeployedToken,
  dbTransactionToTransaction,
  isDbConfigured,
} from "@/lib/dbService";

const MOCK_TOKENS: DeployedToken[] = [
  {
    name: "GydsGold",
    symbol: "GGOLD",
    decimals: 9,
    totalSupply: "1000000000",
    currentSupply: "1000000000",
    description: "The gold standard token on GydsChain",
    logoUrl: "",
    contractAddress: "0xAbC1...dEf2",
    transactionHash: "0xTx1...Hash",
    creator: "0x7a3B...9f4E",
    createdAt: "2026-03-01T12:00:00Z",
    isPaused: false,
    website: "https://gydsgold.io",
    twitter: "@gydsgold",
  },
  {
    name: "NetlifyCoin",
    symbol: "NTFY",
    decimals: 9,
    totalSupply: "500000000",
    currentSupply: "500000000",
    description: "Official token of NetlifyGY ecosystem",
    logoUrl: "",
    contractAddress: "0xDeF3...gHi4",
    transactionHash: "0xTx2...Hash",
    creator: "0x7a3B...9f4E",
    createdAt: "2026-03-03T08:30:00Z",
    isPaused: false,
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { hash: "0xTx1...Hash", type: "create", tokenSymbol: "GGOLD", timestamp: "2026-03-01T12:00:00Z", status: "success" },
  { hash: "0xTx2...Hash", type: "create", tokenSymbol: "NTFY", timestamp: "2026-03-03T08:30:00Z", status: "success" },
  { hash: "0xTx3...Hash", type: "mint", tokenSymbol: "GGOLD", amount: "5000000", timestamp: "2026-03-04T10:15:00Z", status: "success" },
];

// DEX router address on GydsChain
const DEX_ROUTER_ADDRESS = "0x0000000000000000000000000000000000000002";

interface UseTokensOptions {
  provider?: EthereumProvider | null;
  walletAddress?: string | null;
}

export const useTokens = (options: UseTokensOptions = {}) => {
  const { provider, walletAddress } = options;
  const [tokens, setTokens] = useState<DeployedToken[]>(MOCK_TOKENS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadFromDb = useCallback(async () => {
    if (!isDbConfigured()) return;
    setIsLoading(true);
    try {
      const config = getActiveConfig();
      const network = config.networkName.toLowerCase().includes("mainnet") ? "mainnet" : "devnet";
      const [dbTokens, dbTxs] = await Promise.all([
        fetchTokens(network),
        fetchTransactions(network),
      ]);
      if (dbTokens.length > 0) setTokens(dbTokens.map(dbTokenToDeployedToken));
      if (dbTxs.length > 0) setTransactions(dbTxs.map(dbTransactionToTransaction));
    } catch (err) {
      console.warn("[useTokens] Failed to load from DB:", err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  /** Deploy a new ERC-20 token with real contract bytecode */
  const deployToken = async (
    metadata: Omit<DeployedToken, "contractAddress" | "transactionHash" | "creator" | "createdAt" | "isPaused" | "currentSupply">
  ): Promise<DeployedToken> => {
    setIsDeploying(true);

    let txHash = "";
    let contractAddress = "";
    const creatorAddr = walletAddress || "0x7a3B...9f4E";

    // Try real deployment via wallet
    if (provider && walletAddress) {
      try {
        const feesInWei = BigInt(Math.floor(activeConfig.fees.tokenCreation * 1e18));

        toast.info("Deploying ERC-20 contract — please confirm in your wallet...");

        txHash = await deployERC20(
          provider,
          walletAddress,
          metadata.name,
          metadata.symbol,
          metadata.decimals,
          metadata.totalSupply,
          feesInWei.toString()
        );

        toast.success("Transaction submitted! Waiting for confirmation...");

        // Wait for receipt to get contract address
        try {
          const receipt = await getTransactionReceipt(provider, txHash, 30, 2000);
          contractAddress = receipt.contractAddress || `0x${txHash.slice(2, 10)}...${txHash.slice(-8)}`;
          
          if (receipt.status === "failed") {
            toast.error("Contract deployment failed on-chain.");
          } else {
            toast.success(`Contract deployed at ${contractAddress.slice(0, 10)}...`);
          }
        } catch {
          // Timeout — use derived address
          contractAddress = `0x${txHash.slice(2, 10)}...${txHash.slice(-8)}`;
          toast.info("Couldn't confirm receipt yet. Contract address derived from tx hash.");
        }

        console.info(`[Token] Deployed ERC-20 via tx: ${txHash} → ${contractAddress}`);
      } catch (err) {
        console.error("[Token] Real deployment failed:", err);
        toast.error("Deployment failed. Using mock deployment.");
      }
    }

    // Fallback mock
    if (!txHash) {
      await new Promise((r) => setTimeout(r, 2500));
      txHash = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
      contractAddress = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    }

    const newToken: DeployedToken = {
      ...metadata,
      currentSupply: metadata.totalSupply,
      contractAddress,
      transactionHash: txHash,
      creator: creatorAddr,
      createdAt: new Date().toISOString(),
      isPaused: false,
    };

    // Persist to DB
    if (isDbConfigured()) {
      const config = getActiveConfig();
      const network = config.networkName.toLowerCase().includes("mainnet") ? "mainnet" : "devnet";
      await Promise.all([
        createToken({
          name: newToken.name,
          symbol: newToken.symbol,
          decimals: newToken.decimals,
          total_supply: newToken.totalSupply,
          current_supply: newToken.currentSupply,
          description: newToken.description,
          logo_url: newToken.logoUrl,
          website: newToken.website,
          twitter: newToken.twitter,
          telegram: newToken.telegram,
          contract_address: newToken.contractAddress,
          transaction_hash: newToken.transactionHash,
          creator_address: newToken.creator,
          network,
          is_paused: false,
          freeze_revoked: true,
          mint_revoked: false,
        }),
        createTransaction({
          hash: newToken.transactionHash,
          type: "create",
          token_symbol: newToken.symbol,
          from_address: newToken.creator,
          status: "success",
          network,
        }),
      ]);
    }

    setTokens((prev) => [newToken, ...prev]);
    setTransactions((prev) => [
      {
        hash: newToken.transactionHash,
        type: "create",
        tokenSymbol: newToken.symbol,
        timestamp: newToken.createdAt,
        status: "success",
      },
      ...prev,
    ]);

    setIsDeploying(false);
    return newToken;
  };

  /** Burn tokens using real ERC-20 burn function */
  const burnTokens = async (tokenAddress: string, amount: string): Promise<string> => {
    const token = tokens.find((t) => t.contractAddress === tokenAddress);
    if (!token) throw new Error("Token not found");

    let txHash = "";

    if (provider && walletAddress) {
      try {
        const data = encodeBurnCall(amount, token.decimals);
        toast.info("Please confirm the burn transaction...");

        txHash = await sendTransaction(provider, {
          from: walletAddress,
          to: tokenAddress.includes("...") ? tokenAddress.replace(/\.\.\./g, "0".repeat(32)).slice(0, 42) : tokenAddress,
          data,
        });

        toast.success("Burn transaction submitted!");
        console.info(`[Token] Burned via tx: ${txHash}`);
      } catch (err) {
        console.error("[Token] Burn failed:", err);
        toast.error("Burn failed. Using mock burn.");
      }
    }

    if (!txHash) {
      await new Promise((r) => setTimeout(r, 2000));
      txHash = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    }

    const newTx: Transaction = {
      hash: txHash,
      type: "burn",
      tokenSymbol: token.symbol,
      amount,
      timestamp: new Date().toISOString(),
      status: "success",
    };

    if (isDbConfigured()) {
      const config = getActiveConfig();
      const network = config.networkName.toLowerCase().includes("mainnet") ? "mainnet" : "devnet";
      await createTransaction({
        hash: txHash,
        type: "burn",
        token_symbol: token.symbol,
        amount,
        from_address: walletAddress || "0x7a3B...9f4E",
        status: "success",
        network,
      });
    }

    setTransactions((prev) => [newTx, ...prev]);
    return txHash;
  };

  /** Swap tokens using DEX router contract */
  const swapTokens = async (
    fromToken: string,
    toToken: string,
    amountIn: string,
    amountOutMin: string,
    routerAddress = DEX_ROUTER_ADDRESS
  ): Promise<string> => {
    let txHash = "";

    if (provider && walletAddress) {
      try {
        const amountInWei = BigInt(Math.floor(Number(amountIn) * 1e18)).toString();
        const amountOutMinWei = BigInt(Math.floor(Number(amountOutMin) * 1e18)).toString();
        const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 min

        const data = encodeSwapCall(
          amountInWei,
          amountOutMinWei,
          [fromToken, toToken],
          walletAddress,
          deadline
        );

        toast.info("Please confirm the swap transaction...");

        txHash = await sendTransaction(provider, {
          from: walletAddress,
          to: routerAddress,
          value: fromToken === "GYDS" ? `0x${BigInt(amountInWei).toString(16)}` : undefined,
          data,
        });

        toast.success("Swap transaction submitted!");
        console.info(`[Swap] Completed via tx: ${txHash}`);
      } catch (err) {
        console.error("[Swap] Transaction failed:", err);
        toast.error("Swap failed. Using mock swap.");
      }
    }

    if (!txHash) {
      await new Promise((r) => setTimeout(r, 2000));
      txHash = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    }

    return txHash;
  };

  /** Transfer ERC-20 tokens to another address */
  const transferTokens = async (tokenAddress: string, to: string, amount: string): Promise<string> => {
    const token = tokens.find((t) => t.contractAddress === tokenAddress);
    if (!token) throw new Error("Token not found");

    let txHash = "";

    if (provider && walletAddress) {
      try {
        // ERC-20 transfer(address,uint256) selector: 0xa9059cbb
        const amountWei = BigInt(Math.floor(Number(amount) * 10 ** token.decimals));
        const paddedTo = to.replace("0x", "").padStart(64, "0");
        const paddedAmount = amountWei.toString(16).padStart(64, "0");
        const data = `0xa9059cbb${paddedTo}${paddedAmount}`;

        toast.info("Please confirm the transfer transaction...");

        const normalizedAddr = tokenAddress.includes("...")
          ? tokenAddress.replace(/\.\.\./g, "0".repeat(32)).slice(0, 42)
          : tokenAddress;

        txHash = await sendTransaction(provider, {
          from: walletAddress,
          to: normalizedAddr,
          data,
        });

        toast.success("Transfer submitted!");
        console.info(`[Token] Transfer via tx: ${txHash}`);
      } catch (err) {
        console.error("[Token] Transfer failed:", err);
        toast.error("Transfer failed. Using mock transfer.");
      }
    }

    if (!txHash) {
      await new Promise((r) => setTimeout(r, 1500));
      txHash = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    }

    const newTx: Transaction = {
      hash: txHash,
      type: "transfer",
      tokenSymbol: token.symbol,
      amount,
      timestamp: new Date().toISOString(),
      status: "success",
    };

    if (isDbConfigured()) {
      const config = getActiveConfig();
      const network = config.networkName.toLowerCase().includes("mainnet") ? "mainnet" : "devnet";
      await createTransaction({
        hash: txHash,
        type: "transfer",
        token_symbol: token.symbol,
        amount,
        from_address: walletAddress || "0x7a3B...9f4E",
        to_address: to,
        status: "success",
        network,
      });
    }

    setTransactions((prev) => [newTx, ...prev]);
    return txHash;
  };

  const refresh = () => { loadFromDb(); };

  return {
    tokens,
    transactions,
    deployToken,
    burnTokens,
    swapTokens,
    transferTokens,
    isDeploying,
    isLoading,
    refresh,
  };
};
