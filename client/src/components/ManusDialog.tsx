import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, Shield } from "lucide-react";

interface ManusDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function ManusDialog({
  title,
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={onOpenChange ? open : internalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="py-6 bg-[oklch(0.08_0.003_250)] rounded-xl w-[420px] shadow-2xl border border-[oklch(0.18_0.004_250)] backdrop-blur-2xl p-0 gap-0 text-center">
        <div className="flex flex-col items-center gap-3 p-6 pt-10">
          {/* EAS Brand Mark */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[oklch(0.35_0.12_155)] to-[oklch(0.25_0.08_155)] flex items-center justify-center border border-[oklch(0.35_0.12_155/30%)]">
            <Zap className="w-7 h-7 text-white" />
          </div>

          <DialogTitle className="text-xl font-heading text-white tracking-wide">
            {title || "Sign In to EAS Training"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[oklch(0.55_0.008_250)] leading-relaxed">
            Access your courses, simulator, and certifications
          </DialogDescription>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 flex flex-col gap-3">
          <Button
            onClick={onLogin}
            className="w-full h-11 bg-[oklch(0.35_0.12_155)] hover:bg-[oklch(0.40_0.12_155)] text-white rounded-lg text-sm font-semibold tracking-wide transition-all"
          >
            Continue to Sign In
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[oklch(0.40_0.006_250)]">
            <Shield className="w-3 h-3" />
            <span>Secure authentication · 256-bit encryption</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
