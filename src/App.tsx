import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { useWallet } from "@/hooks/useWallet";
import { useTokens } from "@/hooks/useTokens";
import Index from "./pages/Index";
import CreateTokenPage from "./pages/CreateToken";
import DashboardPage from "./pages/Dashboard";
import GalleryPage from "./pages/Gallery";
import AnalyticsPage from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { wallet, connect, disconnect, isConnecting } = useWallet();
  const { tokens, transactions, deployToken, isDeploying } = useTokens();

  return (
    <>
      <Navbar
        wallet={wallet}
        onConnect={() => connect("phantom")}
        onDisconnect={disconnect}
        isConnecting={isConnecting}
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
              onConnectWallet={() => connect("phantom")}
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
