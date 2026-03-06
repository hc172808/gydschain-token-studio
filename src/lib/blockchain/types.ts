export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  description: string;
  logoUrl: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface DeployedToken extends TokenMetadata {
  contractAddress: string;
  transactionHash: string;
  creator: string;
  createdAt: string;
  isPaused: boolean;
  currentSupply: string;
}

export interface WalletState {
  address: string | null;
  balance: string;
  isConnected: boolean;
  networkName: string;
}

export interface Transaction {
  hash: string;
  type: "create" | "mint" | "burn" | "transfer" | "pause";
  tokenSymbol: string;
  amount?: string;
  timestamp: string;
  status: "success" | "pending" | "failed";
}
