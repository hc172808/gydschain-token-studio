import { useState, useEffect, useCallback, useRef } from "react";
import { getBlockNumber, getActiveRpcUrl } from "@/lib/blockchain/rpcClient";

export type NetworkHealth = "connected" | "degraded" | "offline";

interface NetworkStatus {
  health: NetworkHealth;
  activeEndpoint: string;
  latencyMs: number | null;
  blockNumber: number | null;
  lastChecked: number;
}

const HEALTH_POLL_MS = 10_000;

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    health: "offline",
    activeEndpoint: getActiveRpcUrl(),
    latencyMs: null,
    blockNumber: null,
    lastChecked: 0,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkHealth = useCallback(async () => {
    const start = Date.now();
    try {
      const blockHex = await getBlockNumber();
      const latency = Date.now() - start;
      const blockNumber = parseInt(blockHex, 16);

      setStatus({
        health: latency < 3000 ? "connected" : "degraded",
        activeEndpoint: getActiveRpcUrl(),
        latencyMs: latency,
        blockNumber,
        lastChecked: Date.now(),
      });
    } catch {
      setStatus((prev) => ({
        ...prev,
        health: "offline",
        activeEndpoint: getActiveRpcUrl(),
        latencyMs: null,
        lastChecked: Date.now(),
      }));
    }
  }, []);

  useEffect(() => {
    checkHealth();
    pollRef.current = setInterval(checkHealth, HEALTH_POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkHealth]);

  return { ...status, refresh: checkHealth };
};
