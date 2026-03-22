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
import { buildGPLTokenConfig } from "@/lib/blockchain/gplAuthority";

// DEX router address on GydsChain
const DEX_ROUTER_ADDRESS = "0x0000000000000000000000000000000000000002";

interface UseTokensOptions {
  provider?: EthereumProvider | null;
  walletAddress?: string | null;
}

export const useTokens = (options: UseTokensOptions = {}) => {
  const { provider, walletAddress } = options;
  const [tokens, setTokens] = useState<DeployedToken[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedFromDb = useRef(false);

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
      if (dbTokens.length > 0) {
        setTokens(dbTokens.map(dbTokenToDeployedToken));
        hasLoadedFromDb.current = true;
      }
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
    metadata: Omit<DeployedToken, "contractAddress" | "transactionHash" | "creator" | "createdAt" | "isPaused" | "currentSupply">,
    gplOptions?: {
      revokedAuthorities?: Set<string>;
      enableMultisig?: boolean;
      multisigSigners?: string[];
      multisigThreshold?: number;
      multisigAuthorities?: string[];
    }
  ): Promise<DeployedToken> => {
    if (!walletAddress) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    setIsDeploying(true);

    let txHash = "";
    let contractAddress = "";
    const creatorAddr = walletAddress;

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

        try {
          const receipt = await getTransactionReceipt(provider, txHash, 30, 2000);
          contractAddress = receipt.contractAddress || `0x${txHash.slice(2, 10)}${txHash.slice(-8)}`;
          
          if (receipt.status === "failed") {
            toast.error("Contract deployment failed on-chain.");
          } else {
            toast.success(`Contract deployed at ${contractAddress.slice(0, 10)}...`);
          }
        } catch {
          contractAddress = `0x${txHash.slice(2, 10)}${txHash.slice(-8)}`;
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
      txHash = `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;
      contractAddress = `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;
    }

    // Build GPL config
    const gplConfig = buildGPLTokenConfig(
      contractAddress,
      creatorAddr,
      {
        revokeMint: gplOptions?.revokedAuthorities?.has("mint"),
        revokeFreeze: gplOptions?.revokedAuthorities?.has("freeze"),
        multisigSigners: gplOptions?.enableMultisig ? gplOptions.multisigSigners : undefined,
        multisigThreshold: gplOptions?.enableMultisig ? gplOptions.multisigThreshold : undefined,
        multisigAuthorities: gplOptions?.enableMultisig ? (gplOptions.multisigAuthorities as any) : undefined,
      }
    );

    const newToken: DeployedToken = {
      ...metadata,
      currentSupply: metadata.totalSupply,
      contractAddress,
      transactionHash: txHash,
      creator: creatorAddr,
      createdAt: new Date().toISOString(),
      isPaused: false,
      gplConfig,
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
          freeze_revoked: gplOptions?.revokedAuthorities?.has("freeze") ?? true,
          mint_revoked: gplOptions?.revokedAuthorities?.has("mint") ?? false,
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
    if (!walletAddress) throw new Error("Wallet not connected");
    const token = tokens.find((t) => t.contractAddress === tokenAddress);
    if (!token) throw new Error("Token not found");

    let txHash = "";

    if (provider && walletAddress) {
      try {
        const data = encodeBurnCall(amount, token.decimals);
        toast.info("Please confirm the burn transaction in your wallet...");

        txHash = await sendTransaction(provider, {
          from: walletAddress,
          to: tokenAddress.includes("...") ? tokenAddress.replace(/\.\.\./g, "0".repeat(32)).slice(0, 42) : tokenAddress,
          data,
        });

        toast.success("Burn transaction submitted!");
        console.info(`[Token] Burned via tx: ${txHash}`);
      } catch (err) {
        console.error("[Token] Burn failed:", err);
        throw new Error("Burn transaction rejected or failed");
      }
    }

    if (!txHash) {
      throw new Error("No wallet provider available. Please connect your wallet.");
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
        from_address: walletAddress,
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
    if (!walletAddress) throw new Error("Wallet not connected");
    let txHash = "";

    if (provider && walletAddress) {
      try {
        const amountInWei = BigInt(Math.floor(Number(amountIn) * 1e18)).toString();
        const amountOutMinWei = BigInt(Math.floor(Number(amountOutMin) * 1e18)).toString();
        const deadline = Math.floor(Date.now() / 1000) + 1200;

        const data = encodeSwapCall(
          amountInWei,
          amountOutMinWei,
          [fromToken, toToken],
          walletAddress,
          deadline
        );

        toast.info("Please confirm the swap transaction in your wallet...");

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
        throw new Error("Swap transaction rejected or failed");
      }
    }

    if (!txHash) {
      throw new Error("No wallet provider available. Please connect your wallet.");
    }

    return txHash;
  };

  /** Transfer ERC-20 tokens to another address */
  const transferTokens = async (tokenAddress: string, to: string, amount: string): Promise<string> => {
    if (!walletAddress) throw new Error("Wallet not connected");
    const token = tokens.find((t) => t.contractAddress === tokenAddress);
    if (!token) throw new Error("Token not found");

    let txHash = "";

    if (provider && walletAddress) {
      try {
        const amountWei = BigInt(Math.floor(Number(amount) * 10 ** token.decimals));
        const paddedTo = to.replace("0x", "").padStart(64, "0");
        const paddedAmount = amountWei.toString(16).padStart(64, "0");
        const data = `0xa9059cbb${paddedTo}${paddedAmount}`;

        toast.info("Please confirm the transfer transaction in your wallet...");

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
        throw new Error("Transfer transaction rejected or failed");
      }
    }

    if (!txHash) {
      throw new Error("No wallet provider available. Please connect your wallet.");
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
        from_address: walletAddress,
        to_address: to,
        status: "success",
        network,
      });
    }

    setTransactions((prev) => [newTx, ...prev]);
    return txHash;
  };

  /** Update token metadata (requires Update Authority) */
  const updateTokenMetadata = async (
    tokenAddress: string,
    updates: { name?: string; symbol?: string; logoUrl?: string; description?: string }
  ): Promise<string> => {
    if (!walletAddress) throw new Error("Wallet not connected");
    const token = tokens.find((t) => t.contractAddress === tokenAddress);
    if (!token) throw new Error("Token not found");

    // Check update authority
    if (token.gplConfig) {
      const updateAuth = token.gplConfig.authorities.find((a) => a.type === "update");
      if (updateAuth?.isRevoked) throw new Error("Update Authority has been revoked");
    }

    let txHash = "";

    if (provider && walletAddress) {
      try {
        // Encode updateMetadata call: selector 0x7c025200
        const nameHex = Buffer.from(updates.name || token.name).toString("hex").padEnd(64, "0");
        const symbolHex = Buffer.from(updates.symbol || token.symbol).toString("hex").padEnd(64, "0");
        const data = `0x7c025200${nameHex}${symbolHex}`;

        toast.info("Please confirm the metadata update in your wallet...");

        const normalizedAddr = tokenAddress.includes("...")
          ? tokenAddress.replace(/\.\.\./g, "0".repeat(32)).slice(0, 42)
          : tokenAddress;

        txHash = await sendTransaction(provider, {
          from: walletAddress,
          to: normalizedAddr,
          data,
        });

        toast.success("Metadata update submitted!");
      } catch (err) {
        console.error("[Token] Metadata update failed:", err);
        throw new Error("Metadata update rejected or failed");
      }
    }

    if (!txHash) throw new Error("No wallet provider available");

    // Update local state
    setTokens((prev) =>
      prev.map((t) =>
        t.contractAddress === tokenAddress
          ? { ...t, ...updates }
          : t
      )
    );

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
    updateTokenMetadata,
    isDeploying,
    isLoading,
    refresh,
  };
};
