"use client";

import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import type { AISendConfirmation } from "@/types/plan";

type Props = {
  open: boolean;
  loading: boolean;
  confirmation?: AISendConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
};

export function AIConfirmation({ open, loading, confirmation, onConfirm, onCancel, busy }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061d3a]/45 px-4 backdrop-blur-sm">
      <section className="panel w-full max-w-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-[#107c5c]">AI confirmation</p>
            <h2 className="mt-2 text-2xl font-black">Review before sending</h2>
          </div>
          <button className="btn btn-secondary h-11 w-11 p-0" onClick={onCancel} aria-label="Close confirmation" disabled={busy}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-[#dfe7e1] bg-white/80 p-4">
          {loading ? (
            <p className="flex items-center gap-2 font-bold text-[#445975]"><Loader2 className="h-4 w-4 animate-spin" /> Preparing summary</p>
          ) : (
            <p className="text-lg font-black leading-7">{confirmation?.summary || "Review this USDC transfer before signing."}</p>
          )}
        </div>

        {!loading && confirmation?.riskFlag !== "none" && (
          <div className="mt-4 flex gap-3 rounded-lg border border-[#f0d18a] bg-[#fff8e6] p-3 text-sm text-[#725000]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{confirmation?.riskNote || "Review this recipient and amount before signing."}</p>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>Back</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={loading || busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirm & Send
          </button>
        </div>
      </section>
    </div>
  );
}
