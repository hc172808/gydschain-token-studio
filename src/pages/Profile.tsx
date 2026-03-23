import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  User, Coins, Flame, ArrowLeftRight, Trophy, Copy, ExternalLink,
  Wallet, TrendingUp, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { DeployedToken, Transaction } from "@/lib/blockchain/types";
import { getExplorerUrl } from "@/lib/blockchain/config";
import {
  fetchLeaderboard,
  fetchTransactions,
  fetchTokens,
  isDbConfigured,
  dbTokenToDeployedToken,
  dbTransactionToTransaction,
} from "@/lib/dbService";

interface ProfilePageProps {
  tokens: DeployedToken[];
  transactions: Transaction[];
  wallet: { address: string | null; balance: string; isConnected: boolean };
  onConnectWallet: () => void;
}

const ProfilePage = ({ tokens, transactions, wallet, onConnectWallet }: ProfilePageProps) => {
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [leaderboardScore, setLeaderboardScore] = useState<number>(0);
  const [dbTokens, setDbTokens] = useState<DeployedToken[]>([]);
  const [dbTransactions, setDbTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const allTokens = dbTokens.length > 0 ? dbTokens : tokens;
  const allTransactions = dbTransactions.length > 0 ? dbTransactions : transactions;

  // Filter to user's data — match full or shortened addresses
  const userTokens = allTokens.filter((t) => {
    if (!wallet.address) return false;
    const addr = wallet.address.replace("...", "");
    // Match if creator contains the non-ellipsis parts OR exact match
    return t.creator === wallet.address || t.creator.includes(addr) || 
           wallet.address.includes(t.creator.slice(0, 6));
  });
  const userTransactions = allTransactions.slice(0, 20);

  const stats = {
    tokensCreated: userTokens.length,
    totalBurns: userTransactions.filter((t) => t.type === "burn").length,
    totalSwaps: userTransactions.filter((t) => t.type === "create").length,
    totalValue: userTokens.reduce((sum, t) => sum + Number(t.currentSupply), 0),
  };

  useEffect(() => {
    if (!wallet.isConnected || !isDbConfigured()) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [lb, dbTkns, dbTxs] = await Promise.all([
          fetchLeaderboard("creators", "devnet", 100),
          fetchTokens("devnet"),
          fetchTransactions("devnet", 50),
        ]);

        if (lb.length > 0 && wallet.address) {
          const entry = lb.find((e) =>
            e.wallet_address.includes(wallet.address!.replace("...", ""))
          );
          if (entry) {
            setLeaderboardRank(entry.rank);
            setLeaderboardScore(entry.score);
          }
        }

        if (dbTkns.length > 0) setDbTokens(dbTkns.map(dbTokenToDeployedToken));
        if (dbTxs.length > 0) setDbTransactions(dbTxs.map(dbTransactionToTransaction));
      } catch (err) {
        console.warn("[Profile] Failed to load data:", err);
      }
      setIsLoading(false);
    };

    load();
  }, [wallet.isConnected, wallet.address]);

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied!");
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect a wallet to view your profile, holdings, and activity.
          </p>
          <Button onClick={onConnectWallet} className="btn-gradient">
            <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className="glass-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {wallet.address?.charAt(2)?.toUpperCase() || "G"}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-heading font-bold mb-1">My Profile</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-mono text-sm truncate">{wallet.address}</span>
                  <button onClick={copyAddress} className="p-1 hover:bg-muted/50 rounded">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-heading font-bold gradient-text">
                  {wallet.balance} <span className="text-sm">GYDS</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Coins, label: "Tokens Created", value: stats.tokensCreated, color: "text-primary" },
              { icon: Flame, label: "Total Burns", value: stats.totalBurns, color: "text-[hsl(var(--warning))]" },
              { icon: ArrowLeftRight, label: "Transactions", value: userTransactions.length, color: "text-[hsl(var(--success))]" },
              {
                icon: Trophy,
                label: "Leaderboard Rank",
                value: leaderboardRank ? `#${leaderboardRank}` : "Unranked",
                color: "text-accent",
              },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <p className="text-xl font-heading font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="holdings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/30">
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            {/* Holdings Tab */}
            <TabsContent value="holdings" className="mt-4">
              {userTokens.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No tokens yet. Create your first token!</p>
                  <Link to="/create">
                    <Button className="btn-gradient">Create Token</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {userTokens.map((token) => (
                    <Link
                      key={token.contractAddress}
                      to={`/token/${encodeURIComponent(token.contractAddress)}`}
                      className="glass-card p-4 flex items-center justify-between hover:border-primary/30 transition-colors block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Number(token.currentSupply).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Supply</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              {userTransactions.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No activity yet.</p>
                </div>
              ) : (
                <div className="glass-card overflow-hidden">
                  <div className="divide-y divide-border/20">
                    {userTransactions.map((tx) => (
                      <div key={tx.hash} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === "create"
                                ? "bg-primary/10 text-primary"
                                : tx.type === "burn"
                                ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
                                : "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                            }`}
                          >
                            {tx.type === "create" && <Coins className="w-4 h-4" />}
                            {tx.type === "burn" && <Flame className="w-4 h-4" />}
                            {tx.type === "mint" && <TrendingUp className="w-4 h-4" />}
                            {tx.type === "transfer" && <ArrowLeftRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize">{tx.type}</p>
                            <p className="text-xs text-muted-foreground font-mono">{tx.tokenSymbol}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          {tx.amount && (
                            <span className="text-sm">{Number(tx.amount).toLocaleString()}</span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              tx.status === "success"
                                ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
                                : tx.status === "pending"
                                ? "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]"
                                : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {tx.status}
                          </span>
                          <a
                            href={getExplorerUrl("tx", tx.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-muted/50 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Token Creator",
                    description: "Create your first token",
                    unlocked: stats.tokensCreated > 0,
                    icon: Coins,
                  },
                  {
                    title: "Pyromaniac",
                    description: "Burn tokens for the first time",
                    unlocked: stats.totalBurns > 0,
                    icon: Flame,
                  },
                  {
                    title: "Leaderboard Legend",
                    description: "Reach top 10 on leaderboard",
                    unlocked: leaderboardRank !== null && leaderboardRank <= 10,
                    icon: Trophy,
                  },
                  {
                    title: "Power User",
                    description: "Complete 10+ transactions",
                    unlocked: userTransactions.length >= 10,
                    icon: TrendingUp,
                  },
                ].map((achievement) => (
                  <div
                    key={achievement.title}
                    className={`glass-card p-4 flex items-center gap-3 ${
                      achievement.unlocked ? "border-primary/30" : "opacity-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.unlocked ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <achievement.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                    {achievement.unlocked && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]">
                        Unlocked
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
