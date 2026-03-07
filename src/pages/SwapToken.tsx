import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, Settings, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { DeployedToken } from "@/lib/blockchain/types";

interface SwapTokenPageProps {
  tokens: DeployedToken[];
  isWalletConnected: boolean;
  onConnectWallet: () => void;
}

const SwapTokenPage = ({ tokens, isWalletConnected, onConnectWallet }: SwapTokenPageProps) => {
  const [fromToken, setFromToken] = useState("GYDS");
  const [toToken, setToToken] = useState("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [showSettings, setShowSettings] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const allTokens = [{ symbol: "GYDS", name: "GYDS (Native)" }, ...tokens.map((t) => ({ symbol: t.symbol, name: t.name }))];

  const handleSwapDirection = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleFromAmountChange = (val: string) => {
    setFromAmount(val);
    // Mock price calculation
    if (val && Number(val) > 0) {
      setToAmount((Number(val) * 1247.5).toFixed(2));
    } else {
      setToAmount("");
    }
  };

  const handleSwap = async () => {
    if (!isWalletConnected) { onConnectWallet(); return; }
    setIsSwapping(true);
    await new Promise((r) => setTimeout(r, 2500));
    setIsSwapping(false);
    toast.success(`Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`);
    setFromAmount("");
    setToAmount("");
  };

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <ArrowDownUp className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">Connect a wallet to swap tokens.</p>
          <Button onClick={onConnectWallet} className="btn-gradient">Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold">
                <span className="gradient-text">Swap</span>
              </h1>
              <p className="text-muted-foreground">Trade tokens on GydsChain</p>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Slippage settings */}
          {showSettings && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-4 mb-4">
              <Label className="text-xs">Slippage Tolerance</Label>
              <div className="flex gap-2 mt-2">
                {["0.1", "0.5", "1.0", "3.0"].map((s) => (
                  <button key={s} onClick={() => setSlippage(s)} className={`px-3 py-1.5 rounded-lg text-sm ${slippage === s ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                    {s}%
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="glass-card p-6 space-y-2">
            {/* From */}
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">From</span>
                <span className="text-xs text-muted-foreground">Balance: 142.58</span>
              </div>
              <div className="flex gap-3">
                <Input value={fromAmount} onChange={(e) => handleFromAmountChange(e.target.value)} placeholder="0.0" className="bg-transparent border-0 text-2xl font-bold p-0 h-auto focus-visible:ring-0" type="number" />
                <Select value={fromToken} onValueChange={setFromToken}>
                  <SelectTrigger className="w-36 bg-muted/50 border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allTokens.map((t) => (
                      <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center -my-1 relative z-10">
              <button onClick={handleSwapDirection} className="w-10 h-10 rounded-full bg-muted/80 border-4 border-background flex items-center justify-center hover:bg-primary/20 transition-colors group">
                <ArrowDownUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>

            {/* To */}
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">To</span>
              </div>
              <div className="flex gap-3">
                <Input value={toAmount} readOnly placeholder="0.0" className="bg-transparent border-0 text-2xl font-bold p-0 h-auto focus-visible:ring-0" />
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="w-36 bg-muted/50 border-border/30">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTokens.filter((t) => t.symbol !== fromToken).map((t) => (
                      <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price info */}
            {fromAmount && toAmount && (
              <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Rate</span><span>1 {fromToken} ≈ 1,247.5 {toToken}</span></div>
                <div className="flex justify-between"><span>Slippage</span><span>{slippage}%</span></div>
                <div className="flex justify-between"><span>Fee</span><span>0.25%</span></div>
              </div>
            )}

            <Button onClick={handleSwap} disabled={isSwapping || !fromAmount || !toToken} className="w-full btn-gradient mt-4">
              {isSwapping ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Swapping...</> : "Swap"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SwapTokenPage;
