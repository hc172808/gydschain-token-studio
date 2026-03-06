import { motion } from "framer-motion";
import { Copy, ExternalLink, Flame, Coins, Pause, Play, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DeployedToken, Transaction } from "@/lib/blockchain/types";
import { getExplorerUrl } from "@/lib/blockchain/config";

interface DashboardPageProps {
  tokens: DeployedToken[];
  transactions: Transaction[];
  isWalletConnected: boolean;
}

const DashboardPage = ({ tokens, transactions, isWalletConnected }: DashboardPageProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (!isWalletConnected) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <h2 className="text-2xl font-heading font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Connect a wallet to view and manage your tokens.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-heading font-bold mb-2">
            Token <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground mb-8">Manage your deployed tokens</p>

          {/* Token Cards */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {tokens.map((token) => (
              <div key={token.contractAddress} className="glass-card p-6 glow-effect">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-bold text-xl">{token.name}</h3>
                    <p className="text-primary font-mono text-sm">{token.symbol}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${token.isPaused ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}`}>
                    {token.isPaused ? "Paused" : "Active"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-muted-foreground text-xs">Supply</span>
                    <p className="font-medium">{Number(token.currentSupply).toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-muted-foreground text-xs">Decimals</span>
                    <p className="font-medium">{token.decimals}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3 mb-4">
                  <span className="font-mono text-xs text-muted-foreground">{token.contractAddress}</span>
                  <div className="flex gap-1">
                    <button onClick={() => copyToClipboard(token.contractAddress)} className="p-1 rounded hover:bg-muted/50">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <a href={getExplorerUrl("token", token.contractAddress)} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted/50">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="border-border/50 text-xs gap-1.5">
                    <Coins className="w-3.5 h-3.5" /> Mint
                  </Button>
                  <Button size="sm" variant="outline" className="border-border/50 text-xs gap-1.5">
                    <Flame className="w-3.5 h-3.5" /> Burn
                  </Button>
                  <Button size="sm" variant="outline" className="border-border/50 text-xs gap-1.5">
                    {token.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    {token.isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button size="sm" variant="outline" className="border-border/50 text-xs gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Transfer
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Transactions */}
          <h2 className="text-2xl font-heading font-bold mb-4">Recent Transactions</h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-4 text-muted-foreground font-medium">Type</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Token</th>
                  <th className="text-left p-4 text-muted-foreground font-medium hidden sm:table-cell">Hash</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.hash} className="border-b border-border/20 hover:bg-muted/20">
                    <td className="p-4 capitalize">{tx.type}</td>
                    <td className="p-4 font-mono text-primary">{tx.tokenSymbol}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      <a href={getExplorerUrl("tx", tx.hash)} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                        {tx.hash} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${tx.status === "success" ? "bg-success/20 text-success" : tx.status === "pending" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
