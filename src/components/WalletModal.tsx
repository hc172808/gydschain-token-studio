import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const WALLETS: WalletOption[] = [
  { id: "phantom", name: "Phantom", icon: "👻", description: "Popular multi-chain wallet" },
  { id: "solflare", name: "Solflare", icon: "🔥", description: "GydsChain native wallet" },
  { id: "backpack", name: "Backpack", icon: "🎒", description: "Next-gen crypto wallet" },
  { id: "gyds-wallet", name: "GYDS Wallet", icon: "⚡", description: "Official GydsChain wallet" },
];

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (walletType: string) => void;
  isConnecting: boolean;
  connectingWallet: string | null;
}

export const WalletModal = ({ open, onOpenChange, onConnect, isConnecting, connectingWallet }: WalletModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card-strong border-border/50 max-w-md p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Connect Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Choose a wallet to connect to GydsChain
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 pt-2 space-y-2">
          {WALLETS.map((wallet, i) => (
            <motion.button
              key={wallet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onConnect(wallet.id)}
              disabled={isConnecting}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {wallet.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">{wallet.name}</p>
                <p className="text-xs text-muted-foreground">{wallet.description}</p>
              </div>
              {isConnecting && connectingWallet === wallet.id ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </motion.button>
          ))}
        </div>

        <div className="px-6 pb-5 pt-2">
          <p className="text-xs text-muted-foreground text-center">
            By connecting, you agree to the Terms of Service. We never access your private keys.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
