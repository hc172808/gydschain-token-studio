import { useState } from "react";
import type { DeployedToken, Transaction } from "@/lib/blockchain/types";

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

export const useTokens = () => {
  const [tokens, setTokens] = useState<DeployedToken[]>(MOCK_TOKENS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [isDeploying, setIsDeploying] = useState(false);

  const deployToken = async (metadata: Omit<DeployedToken, "contractAddress" | "transactionHash" | "creator" | "createdAt" | "isPaused" | "currentSupply">) => {
    setIsDeploying(true);
    await new Promise((r) => setTimeout(r, 3000));
    const newToken: DeployedToken = {
      ...metadata,
      currentSupply: metadata.totalSupply,
      contractAddress: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      transactionHash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      creator: "0x7a3B...9f4E",
      createdAt: new Date().toISOString(),
      isPaused: false,
    };
    setTokens((prev) => [newToken, ...prev]);
    setTransactions((prev) => [
      { hash: newToken.transactionHash, type: "create", tokenSymbol: newToken.symbol, timestamp: newToken.createdAt, status: "success" },
      ...prev,
    ]);
    setIsDeploying(false);
    return newToken;
  };

  return { tokens, transactions, deployToken, isDeploying };
};
