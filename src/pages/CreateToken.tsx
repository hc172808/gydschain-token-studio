import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, ExternalLink, Upload, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TokenMetadata, DeployedToken } from "@/lib/blockchain/types";
import { activeConfig, getExplorerUrl } from "@/lib/blockchain/config";

interface CreateTokenPageProps {
  isWalletConnected: boolean;
  onDeploy: (meta: TokenMetadata) => Promise<DeployedToken>;
  isDeploying: boolean;
  onConnectWallet: () => void;
}

const STEPS = ["Token Info", "Details", "Authority", "Preview", "Deploy"];

const CreateTokenPage = ({ isWalletConnected, onDeploy, isDeploying, onConnectWallet }: CreateTokenPageProps) => {
  const [step, setStep] = useState(0);
  const [deployed, setDeployed] = useState<DeployedToken | null>(null);
  const [revokeFreeze, setRevokeFreeze] = useState(true);
  const [revokeMint, setRevokeMint] = useState(false);
  const [form, setForm] = useState<TokenMetadata>({
    name: "",
    symbol: "",
    decimals: 6,
    totalSupply: "1000000000",
    description: "",
    logoUrl: "",
    website: "",
    twitter: "",
    telegram: "",
  });

  const updateField = (key: keyof TokenMetadata, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    if (step === 0) return form.name.trim().length >= 2 && form.symbol.trim().length >= 2 && form.symbol.trim().length <= 8;
    if (step === 1) return form.description.trim().length > 0 && Number(form.totalSupply) > 0;
    return true;
  };

  const handleDeploy = async () => {
    if (!isWalletConnected) {
      onConnectWallet();
      return;
    }
    try {
      const result = await onDeploy(form);
      setDeployed(result);
      setStep(4);
      toast.success("Token deployed successfully!");
    } catch {
      toast.error("Deployment failed. Please try again.");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-heading font-bold mb-2">
            Create <span className="gradient-text">Token</span>
          </h1>
          <p className="text-muted-foreground mb-8">Deploy a new token on {activeConfig.networkName}</p>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`step-indicator ${i < step ? "step-indicator-completed" : i === step ? "step-indicator-active" : "step-indicator-pending"}`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-success" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6 space-y-5">
                <div>
                  <Label>Token Name *</Label>
                  <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. GydsGold" className="mt-1.5 bg-muted/50 border-border/50" maxLength={50} />
                </div>
                <div>
                  <Label>Token Symbol *</Label>
                  <Input value={form.symbol} onChange={(e) => updateField("symbol", e.target.value.toUpperCase())} placeholder="e.g. GGOLD" className="mt-1.5 bg-muted/50 border-border/50" maxLength={10} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Decimals</Label>
                    <Input type="number" value={form.decimals} onChange={(e) => updateField("decimals", parseInt(e.target.value) || 0)} className="mt-1.5 bg-muted/50 border-border/50" min={0} max={18} />
                  </div>
                  <div>
                    <Label>Total Supply *</Label>
                    <Input value={form.totalSupply} onChange={(e) => updateField("totalSupply", e.target.value)} className="mt-1.5 bg-muted/50 border-border/50" placeholder="1000000000" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6 space-y-5">
                <div>
                  <Label>Description *</Label>
                  <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe your token..." className="mt-1.5 bg-muted/50 border-border/50 min-h-[100px]" maxLength={500} />
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input value={form.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} placeholder="https://..." className="bg-muted/50 border-border/50" />
                    <Button variant="outline" size="icon" className="shrink-0 border-border/50">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://..." className="mt-1.5 bg-muted/50 border-border/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Twitter / X</Label>
                    <Input value={form.twitter} onChange={(e) => updateField("twitter", e.target.value)} placeholder="@handle" className="mt-1.5 bg-muted/50 border-border/50" />
                  </div>
                  <div>
                    <Label>Telegram</Label>
                    <Input value={form.telegram} onChange={(e) => updateField("telegram", e.target.value)} placeholder="@group" className="mt-1.5 bg-muted/50 border-border/50" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6 space-y-5">
                <h3 className="font-heading font-semibold text-lg">Authority Settings</h3>
                <p className="text-sm text-muted-foreground">Control minting and freezing permissions for your token.</p>

                <button
                  onClick={() => setRevokeFreeze(!revokeFreeze)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${revokeFreeze ? "border-primary bg-primary/10" : "border-border/50 bg-muted/30"}`}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 ${revokeFreeze ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {revokeFreeze && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Revoke Freeze Authority <span className="text-xs text-warning ml-1">(Required for LP)</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Allows you to create a liquidity pool. Cost: 0.1 GYDS</p>
                  </div>
                </button>

                <button
                  onClick={() => setRevokeMint(!revokeMint)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${revokeMint ? "border-primary bg-primary/10" : "border-border/50 bg-muted/30"}`}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 ${revokeMint ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {revokeMint && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Revoke Mint Authority</p>
                    <p className="text-xs text-muted-foreground mt-1">Ensures no more tokens can be minted. Provides security to buyers. Cost: 0.1 GYDS</p>
                  </div>
                </button>

                <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                  <p>You can also revoke mint authority later from the Dashboard.</p>
                </div>
              </motion.div>
            )}

            {step === 3 && !deployed && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card p-6 space-y-4">
                <h3 className="font-heading font-semibold text-lg mb-4">Token Preview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Name", form.name],
                    ["Symbol", form.symbol],
                    ["Decimals", String(form.decimals)],
                    ["Total Supply", Number(form.totalSupply).toLocaleString()],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-muted/30 rounded-lg p-3">
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <p className="font-medium mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                {form.description && (
                  <div className="bg-muted/30 rounded-lg p-3 text-sm">
                    <span className="text-muted-foreground text-xs">Description</span>
                    <p className="mt-0.5">{form.description}</p>
                  </div>
                )}
                {(revokeFreeze || revokeMint) && (
                  <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                    {revokeFreeze && <p>✅ Freeze authority will be revoked (+0.1 GYDS)</p>}
                    {revokeMint && <p>✅ Mint authority will be revoked (+0.1 GYDS)</p>}
                  </div>
                )}
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm text-warning">
                  ⚠️ Total fee: {(activeConfig.fees.tokenCreation + (revokeFreeze ? 0.1 : 0) + (revokeMint ? 0.1 : 0)).toFixed(1)} GYDS
                </div>
              </motion.div>
            )}

            {step === 4 && deployed && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="font-heading font-bold text-2xl">Token Deployed! 🎉</h3>
                <div className="space-y-3 text-left">
                  {[
                    ["Contract Address", deployed.contractAddress],
                    ["Transaction Hash", deployed.transactionHash],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground text-xs">{label}</span>
                        <p className="font-mono text-sm mt-0.5">{value}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => copyToClipboard(value, label)} className="p-1.5 rounded-md hover:bg-muted/50">
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <a href={getExplorerUrl(label === "Contract Address" ? "token" : "tx", value)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted/50">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="border-border/50">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              {step < 3 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="btn-gradient">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleDeploy} disabled={isDeploying} className="btn-gradient">
                  {isDeploying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deploying...</> : "Deploy Token 🚀"}
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CreateTokenPage;
