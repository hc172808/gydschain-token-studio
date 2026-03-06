export interface ChainConfig {
  networkName: string;
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  fees: {
    tokenCreation: number;
    feeCollectorAddress: string;
  };
}

export const DEVNET_CONFIG: ChainConfig = {
  networkName: "GydsChain Devnet",
  rpcUrl: "https://devnet.gydschain.net",
  chainId: 12345,
  explorerUrl: "https://explorer.gydschain.net",
  nativeCurrency: {
    name: "GYDS",
    symbol: "GYDS",
    decimals: 18,
  },
  fees: {
    tokenCreation: 0.5,
    feeCollectorAddress: "0xNetlifyGY_FeeCollector",
  },
};

export const MAINNET_CONFIG: ChainConfig = {
  networkName: "GydsChain Mainnet",
  rpcUrl: "https://mainnet.gydschain.net",
  chainId: 12346,
  explorerUrl: "https://explorer.gydschain.net",
  nativeCurrency: {
    name: "GYDS",
    symbol: "GYDS",
    decimals: 18,
  },
  fees: {
    tokenCreation: 1.0,
    feeCollectorAddress: "0xNetlifyGY_FeeCollector_Mainnet",
  },
};

export const activeConfig: ChainConfig = DEVNET_CONFIG;

export const getExplorerUrl = (type: "tx" | "token" | "address", hash: string) => {
  return `${activeConfig.explorerUrl}/${type}/${hash}`;
};
