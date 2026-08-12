"use client";

import { useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useUsdcAccount } from "@/hooks/use-usdc";
import { useInstantSend } from "@/hooks/useInstantSend";
import { formatUsdc, parseUsdc, shortAddress } from "@/lib/format";
import { getRecentRecipients } from "@/lib/instant-send/storage";
import type { AISendConfirmation, RecentRecipient } from "@/types/plan";
import { AIConfirmation } from "./AIConfirmation";

function localConfirmation(amount: string, recipient: string, sentBefore: boolean, balancePercent: number): AISendConfirmation {
  const large = balancePercent >= 25;
  return {
    summary: `Send ${amount} USDC to ${shortAddress(recipient)}.`,
    riskFlag: !sentBefore ? "first_time_address" : large ? "large_amount" : "none",
    riskNote: !sentBefore
      ? "This recipient is not in your recent Instant Send list."
      : large
        ? "This transfer is a large share of your current USDC balance."
        : ""
  };
}

export function SendForm() {
  const { address } = useAccount();
  const usdc = useUsdcAccount();
  const instantSend = useInstantSend();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [recent, setRecent] = useState<RecentRecipient[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<AISendConfirmation>();
  const [lastSent, setLastSent] = useState<{ recipient: `0x${string}`; amount: string; hash: `0x${string}` }>();

  useEffect(() => {
    setRecent(getRecentRecipients(address));
  }, [address, instantSend.state]);

  const parsedAmount = useMemo(() => {
    try {
      return parseUsdc(amount);
    } catch {
      return 0n;
    }
  }, [amount]);
  const validRecipient = isAddress(recipient);
  const sentBefore = Boolean(address && validRecipient && recent.some((item) => item.address && item.address.toLowerCase() === recipient.toLowerCase()));
  const balancePercent = usdc.balance > 0n ? Number((parsedAmount * 10_000n) / usdc.balance) / 100 : 0;
  const amountValid = parsedAmount > 0n && parsedAmount <= usdc.balance;
  const canReview = Boolean(address && validRecipient && amountValid);
  const recipientError = recipient && !validRecipient ? "Enter a valid wallet address." : "";
  const amountError = amount && parsedAmount <= 0n ? "Enter an amount greater than zero." : amount && parsedAmount > usdc.balance ? "Amount exceeds your USDC balance." : "";

  async function prepareConfirmation() {
    if (!canReview) {
      toast.error("Check recipient and amount before continuing.");
      return;
    }
    const fallback = localConfirmation(amount, recipient, sentBefore, balancePercent);
    setConfirmation(fallback);
    setConfirmOpen(true);
    setConfirmLoading(true);
    try {
      const response = await fetch("/api/ai/send-confirmation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipient, amount, sentBefore, balancePercent })
      });
      const next = await response.json() as AISendConfirmation;
      setConfirmation(next.summary ? next : fallback);
    } catch {
      setConfirmation(fallback);
    } finally {
      setConfirmLoading(false);
    }
  }

  async function confirmSend() {
    if (!validRecipient || !address) return;
    const sentRecipient = recipient as `0x${string}`;
    const sentAmount = amount;
    await instantSend.send(sentRecipient, parsedAmount, sentAmount, memo).then(async (hash) => {
      setLastSent({ recipient: sentRecipient, amount: sentAmount, hash });
      setRecipient("");
      setAmount("");
      setMemo("");
      setConfirmOpen(false);
      setRecent(getRecentRecipients(address));
      await usdc.refetch();
    }).catch(() => undefined);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-[#107c5c]">Instant Send</p>
            <h1 className="mt-2 text-4xl font-black">Send USDC now</h1>
          </div>
          <div className="rounded-lg border border-[#dfe7e1] bg-white/70 px-4 py-3 text-right">
            <p className="text-xs font-bold uppercase text-[#66736d]">Wallet balance</p>
            <p className="text-lg font-black">{formatUsdc(usdc.balance)} USDC</p>
          </div>
        </div>

        <div className="mt-6">
          {lastSent && instantSend.state === "success" && (
            <div className="mb-5 flex gap-3 rounded-lg border border-[#9fd9c2] bg-[#effcf6] p-4 text-sm text-[#0f684b]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">Instant Send completed</p>
                <p className="mt-1">Sent {lastSent.amount} USDC to {shortAddress(lastSent.recipient)}.</p>
                <a className="mt-2 inline-flex font-bold underline" href={`https://testnet.arcscan.app/tx/${lastSent.hash}`} target="_blank">View on ArcScan</a>
              </div>
            </div>
          )}

          <Label text="Recipient wallet address" />
          <Input value={recipient} onChange={setRecipient} placeholder="0x..." />
          {recipientError && <ErrorText text={recipientError} />}
          {validRecipient && !sentBefore && <p className="mt-2 text-sm text-[#66736d]">First time sending to this address with Instant Send.</p>}

          {recent.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {recent.map((item) => (
                <button key={item.address} className="btn btn-secondary min-h-10 text-sm" onClick={() => setRecipient(item.address)}>
                  {shortAddress(item.address)}
                </button>
              ))}
            </div>
          )}

          <Label text="Amount" />
          <Input value={amount} onChange={setAmount} placeholder="10" inputMode="decimal" />
          {amountError && <ErrorText text={amountError} />}
          {parsedAmount > 0n && usdc.balance > 0n && <p className="mt-2 text-sm text-[#66736d]">This is {balancePercent.toFixed(2)}% of your current USDC balance.</p>}

          <Label text="Memo" />
          <textarea className="mt-2 min-h-28 w-full rounded-lg border border-[#dfe7e1] bg-white p-3 outline-[#107c5c]" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="Optional note, stored only in this browser." />

          {instantSend.error && <ErrorText text={instantSend.error} />}

          <button className="btn btn-primary mt-5 w-full" onClick={prepareConfirmation} disabled={!canReview || instantSend.state === "awaiting_signature" || instantSend.state === "pending"}>
            {instantSend.state === "awaiting_signature" || instantSend.state === "pending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {instantSend.state === "awaiting_signature" ? "Waiting for signature" : instantSend.state === "pending" ? "Confirming on Arc" : "Review with AI"}
          </button>
        </div>
      </div>

      <aside className="panel p-5">
        <p className="text-sm font-black uppercase text-[#107c5c]">Send status</p>
        <h2 className="mt-2 text-2xl font-black">{instantSend.state === "success" ? "Transfer complete" : "Ready for review"}</h2>
        <div className="mt-5 grid gap-3">
          <StatusRow label="Network" value="Arc Testnet" />
          <StatusRow label="Asset" value="USDC" />
          <StatusRow label="Recipient" value={validRecipient ? shortAddress(recipient) : "Waiting"} />
          <StatusRow label="Amount" value={parsedAmount > 0n ? `${amount} USDC` : "Waiting"} />
          <StatusRow label="Recent recipients" value={recent.length.toString()} />
        </div>
        <div className="mt-5 flex gap-3 rounded-lg border border-[#dfe7e1] bg-white/70 p-3 text-sm text-[#506058]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#107c5c]" />
          <p>Wallet signature is required. Accrue never moves funds without your confirmation.</p>
        </div>
        {instantSend.hash && (
          <a className="btn btn-secondary mt-5 w-full" href={`https://testnet.arcscan.app/tx/${instantSend.hash}`} target="_blank">View transaction</a>
        )}
        {(instantSend.state === "awaiting_signature" || instantSend.state === "pending") && (
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#445975]"><Loader2 className="h-4 w-4 animate-spin" /> {instantSend.state === "awaiting_signature" ? "Waiting for wallet signature" : "Waiting for Arc confirmation"}</p>
        )}
      </aside>

      <AIConfirmation open={confirmOpen} loading={confirmLoading} confirmation={confirmation} onCancel={() => setConfirmOpen(false)} onConfirm={confirmSend} busy={instantSend.state === "awaiting_signature" || instantSend.state === "pending"} />
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-[#dfe7e1] py-3 text-sm"><span className="text-[#66736d]">{label}</span><span className="max-w-[55%] break-all text-right font-black">{value}</span></div>;
}

function Label({ text }: { text: string }) {
  return <label className="mt-4 block text-sm font-bold text-[#506058]">{text}</label>;
}

function Input({ value, onChange, placeholder, inputMode }: { value: string; onChange: (value: string) => void; placeholder?: string; inputMode?: "decimal" }) {
  return <input className="mt-2 w-full rounded-lg border border-[#dfe7e1] bg-white p-3 outline-[#107c5c]" value={value} placeholder={placeholder} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />;
}

function ErrorText({ text }: { text: string }) {
  return <p className="mt-2 rounded-lg border border-[#efaaa3] bg-[#fff1ef] p-3 text-sm text-[#8a1f13]">{text}</p>;
}
