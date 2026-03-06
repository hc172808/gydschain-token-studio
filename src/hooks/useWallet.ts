import { useState, useCallback } from "react";
import type { WalletState } from "@/lib/blockchain/types";
import { activeConfig } from "@/lib/blockchain/config";

const MOCK_ADDRESS = "0x7a3B...9f4E";
const MOCK_BALANCE = "142.58";

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: "0",
    isConnected: false,
    networkName: activeConfig.networkName,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async (walletType: string) => {
    setIsConnecting(true);
    // Simulate connection delay
    await new Promise((r) => setTimeout(r, 1500));
    setWallet({
      address: MOCK_ADDRESS,
      balance: MOCK_BALANCE,
      isConnected: true,
      networkName: activeConfig.networkName,
    });
    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      balance: "0",
      isConnected: false,
      networkName: activeConfig.networkName,
    });
  }, []);

  return { wallet, connect, disconnect, isConnecting };
};
