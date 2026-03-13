import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { DeployedToken } from "@/lib/blockchain/types";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: DeployedToken | null;
  onTransfer: (tokenAddress: string, to: string, amount: string) => Promise<string>;
}

export const TransferDialog = ({ open, onOpenChange, token, onTransfer }: TransferDialogProps) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleTransfer = async () => {
    if (!token) return;
    if (!recipient || !recipient.startsWith("0x") || recipient.length < 10) {
      toast.error("Enter a valid wallet address");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsSending(true);
    try {
      const txHash = await onTransfer(token.contractAddress, recipient, amount);
      toast.success(`Transfer submitted! Tx: ${txHash.slice(0, 12)}...`);
      setRecipient("");
      setAmount("");
      onOpenChange(false);
    } catch (err) {
      toast.error("Transfer failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
    setIsSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Transfer {token?.symbol || "Tokens"}
          </DialogTitle>
          <DialogDescription>
            Send {token?.name} to another wallet address on GydsChain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Recipient Address</label>
            <Input
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
            />
            {token && (
              <p className="text-xs text-muted-foreground mt-1">
                Available: {Number(token.currentSupply).toLocaleString()} {token.symbol}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={isSending} className="btn-gradient gap-1.5">
            <Send className="w-4 h-4" />
            {isSending ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
