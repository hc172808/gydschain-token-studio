import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { WalletModal } from "@/components/WalletModal";
import { useWallet } from "@/hooks/useWallet";
import { useTokens } from "@/hooks/useTokens";
import Index from "./pages/Index";
import CreateTokenPage from "./pages/CreateToken";
import DashboardPage from "./pages/Dashboard";
import GalleryPage from "./pages/Gallery";
import AnalyticsPage from "./pages/Analytics";
import CreateLiquidityPage from "./pages/CreateLiquidity";
import SwapTokenPage from "./pages/SwapToken";
import RemoveLiquidityPage from "./pages/RemoveLiquidity";
import BurnTokenPage from "./pages/BurnToken";
import BurnAndEarnPage from "./pages/BurnAndEarn";
import LeaderboardPage from "./pages/Leaderboard";
import TokenDetailPage from "./pages/TokenDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { wallet, connect, disconnect, isConnecting } = useWallet();
  const { tokens, transactions, deployToken, isDeploying } = useTokens();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const handleOpenWalletModal = () => setWalletModalOpen(true);

  const handleConnectWallet = async (walletType: string) => {
    setConnectingWallet(walletType);
    await connect(walletType);
    setConnectingWallet(null);
    setWalletModalOpen(false);
  };

  return (
    <>
      <Navbar
        wallet={wallet}
        onConnect={handleOpenWalletModal}
        onDisconnect={disconnect}
        isConnecting={isConnecting}
      />
      <WalletModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        onConnect={handleConnectWallet}
        isConnecting={isConnecting}
        connectingWallet={connectingWallet}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/create"
          element={
            <CreateTokenPage
              isWalletConnected={wallet.isConnected}
              onDeploy={deployToken}
              isDeploying={isDeploying}
              onConnectWallet={handleOpenWalletModal}
            />
          }
        />
        <Route
          path="/dashboard"
          element={<DashboardPage tokens={tokens} transactions={transactions} isWalletConnected={wallet.isConnected} />}
        />
        <Route path="/gallery" element={<GalleryPage tokens={tokens} />} />
        <Route
          path="/analytics"
          element={<AnalyticsPage tokens={tokens} transactions={transactions} isWalletConnected={wallet.isConnected} />}
        />
        <Route
          path="/liquidity"
          element={<CreateLiquidityPage tokens={tokens} isWalletConnected={wallet.isConnected} onConnectWallet={handleOpenWalletModal} />}
        />
        <Route
          path="/swap"
          element={<SwapTokenPage tokens={tokens} isWalletConnected={wallet.isConnected} onConnectWallet={handleOpenWalletModal} />}
        />
        <Route
          path="/remove-liquidity"
          element={<RemoveLiquidityPage isWalletConnected={wallet.isConnected} onConnectWallet={handleOpenWalletModal} />}
        />
        <Route
          path="/burn"
          element={<BurnTokenPage tokens={tokens} isWalletConnected={wallet.isConnected} onConnectWallet={handleOpenWalletModal} />}
        />
        <Route
          path="/burn-and-earn"
          element={<BurnAndEarnPage tokens={tokens} isWalletConnected={wallet.isConnected} onConnectWallet={handleOpenWalletModal} />}
        />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
