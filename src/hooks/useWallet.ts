import { useState, useCallback, useEffect, useRef } from "react";
import type { WalletState } from "@/lib/blockchain/types";
import { activeConfig } from "@/lib/blockchain/config";
import { getBalance, getChainId, getActiveRpcUrl } from "@/lib/blockchain/rpcClient";

const MOCK_ADDRESS = "0x7a3B...9f4E";
const BALANCE_POLL_MS = 15_000;

const hexToDecimal = (hex: string): string => {
  try {
    const wei = BigInt(hex);
    const whole = wei / BigInt(10 ** 18);
    const fraction = wei % BigInt(10 ** 18);
    const fractionStr = fraction.toString().padStart(18, "0").slice(0, 2);
    return `${whole}.${fractionStr}`;
  } catch {
    return "0.00";
  }
};

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: "0",
    isConnected: false,
    networkName: activeConfig.networkName,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<"connected" | "degraded" | "offline">("offline");
  const [activeRpcUrl, setActiveRpcUrl] = useState(activeConfig.rpcUrl);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBalanceAndChain = useCallback(async (address: string) => {
    try {
      const [balanceHex, chainIdHex] = await Promise.all([
        getBalance(address),
        getChainId(),
      ]);
      const balance = hexToDecimal(balanceHex);
      const chainId = parseInt(chainIdHex, 16);
      setWallet((prev) => ({
        ...prev,
        balance,
        networkName:
          chainId === activeConfig.chainId
            ? activeConfig.networkName
            : `Unknown (${chainId})`,
      }));
      setRpcStatus("connected");
      setActiveRpcUrl(getActiveRpcUrl());
    } catch (err) {
      console.warn("[Wallet] RPC fetch failed, using cached data:", err);
      setRpcStatus("degraded");
    }
  }, []);

  const connect = useCallback(
    async (walletType: string) => {
      setIsConnecting(true);
      // Simulate wallet signature prompt
      await new Promise((r) => setTimeout(r, 1500));

      const address = MOCK_ADDRESS;
      setWallet({
        address,
        balance: "0.00",
        isConnected: true,
        networkName: activeConfig.networkName,
      });
      setIsConnecting(false);

      // Fetch real balance from RPC
      fetchBalanceAndChain(address).catch(() => {
        // If RPC fails, set a fallback mock balance
        setWallet((prev) => ({ ...prev, balance: "142.58" }));
        setRpcStatus("offline");
      });
    },
    [fetchBalanceAndChain]
  );

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      balance: "0",
      isConnected: false,
      networkName: activeConfig.networkName,
    });
    setRpcStatus("offline");
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Poll balance while connected
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      pollRef.current = setInterval(() => {
        fetchBalanceAndChain(wallet.address!);
      }, BALANCE_POLL_MS);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [wallet.isConnected, wallet.address, fetchBalanceAndChain]);

  return { wallet, connect, disconnect, isConnecting, rpcStatus, activeRpcUrl };
};
