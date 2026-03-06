import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  wallet: { address: string | null; balance: string; isConnected: boolean };
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/create", label: "Create Token" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/gallery", label: "Gallery" },
  { to: "/analytics", label: "Analytics" },
];

export const Navbar = ({ wallet, onConnect, onDisconnect, isConnecting }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card-strong border-b border-border/30">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center btn-gradient p-0">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-heading text-xl font-bold gradient-text">Netlify Coin Tools</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {wallet.isConnected ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{wallet.balance} GYDS</span>
              <button
                onClick={onDisconnect}
                className="glass-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {wallet.address}
              </button>
            </div>
          ) : (
            <Button onClick={onConnect} disabled={isConnecting} className="btn-gradient text-sm hidden sm:flex">
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card-strong border-t border-border/30"
          >
            <div className="p-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === link.to ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!wallet.isConnected && (
                <Button onClick={() => { onConnect(); setMobileOpen(false); }} className="btn-gradient mt-2">
                  <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
