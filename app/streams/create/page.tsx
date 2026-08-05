"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUsdcAccount } from "@/hooks/use-usdc";
import { formatUsdc, parseUsdc, rateToPerSecond } from "@/lib/format";
import { analyzeBudget, secondsForUnit } from "@/lib/plans/calculations";
import { encodePlanDraft, type PlanDraft } from "@/lib/plans/draft";
import type { DisplayRateUnit } from "@/types/plan";

const units = ["second", "minute", "hour", "day", "week"];

export default function CreateStreamPage() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("2");
  const [unit, setUnit] = useState("hour");
  const [budget, setBudget] = useState("20");
  const [startMode, setStartMode] = useState("now");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const usdc = useUsdcAccount();

  const rate = useMemo(() => rateToPerSecond(amount, unit), [amount, unit]);
  const deposit = useMemo(() => parseUsdc(budget), [budget]);
  const startSeconds = startMode === "now" ? Math.floor(Date.now() / 1000) : Math.floor(new Date(startDate).getTime() / 1000);
  const endSeconds = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : undefined;
  const scheduleValid = Number.isFinite(startSeconds) && (!endSeconds || endSeconds > startSeconds);
  const budgetAnalysis = useMemo(() => analyzeBudget({
    walletBalance: usdc.balance,
    activeCommitments: 0n,
    newCommitment: deposit,
    ratePerSecond: rate,
    startTime: Number.isFinite(startSeconds) ? startSeconds : Math.floor(Date.now() / 1000),
    endTime: endSeconds
  }), [deposit, endSeconds, rate, startSeconds, usdc.balance]);
  const valid = isAddress(receiver) && rate > 0n && deposit > 0n && scheduleValid && budgetAnalysis.canCreate;

  async function submit() {
    try {
      if (!valid) throw new Error("Check receiver, rate, and budget.");
      setSubmitting(true);
      const reviewUnit: DisplayRateUnit = unit === "second" ? "minute" : unit === "minute" || unit === "hour" || unit === "day" || unit === "week" ? unit : "day";
      const reviewRateAmount = unit === "second" ? formatUsdc(rate * secondsForUnit(reviewUnit)) : amount;
      const draft: PlanDraft = {
        source: "manual",
        planType: "custom",
        title: "Custom Payment Plan",
        description: "Manual Accrue Plan",
        explanation: "This Plan covers the currently funded period.",
        receiver: receiver as `0x${string}`,
        totalAmount: budget,
        displayRateAmount: reviewRateAmount,
        displayRateUnit: reviewUnit,
        startTime: startSeconds,
        endTime: endSeconds,
        reserveAmount: "0"
      };
      router.push(`/plans/review?draft=${encodePlanDraft(draft)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-4xl font-black">Create a Stream</h1>
      <p className="mt-2 text-[#66736d]">Approve only the required USDC amount, then create and fund the stream.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => <button key={item} onClick={() => setStep(item)} className={`h-2 rounded-full ${step >= item ? "bg-[#107c5c]" : "bg-[#dfe7e1]"}`} aria-label={`Step ${item}`} />)}
      </div>
      <section className="panel mt-6 p-5">
        {step === 1 && <Step title="Receiver"><Label text="Receiver wallet address" /><Input value={receiver} onChange={setReceiver} placeholder="0x..." /><Label text="Optional stream name" /><Input value="" onChange={() => undefined} placeholder="Freelancer Stream" /></Step>}
        {step === 2 && <Step title="Payment rate"><Label text="Amount" /><Input value={amount} onChange={setAmount} /><Label text="Unit" /><select className="mt-2 w-full rounded-lg border border-[#dfe7e1] bg-white p-3" value={unit} onChange={(e) => setUnit(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select><p className="mt-3 text-sm text-[#66736d]">Contract rate: {rate.toString()} micro-USDC per second. Minimum supported rate is 0.000001 USDC per second after conversion.</p></Step>}
        {step === 3 && <Step title="Duration and budget"><Label text="Maximum total USDC" /><Input value={budget} onChange={setBudget} /><Label text="Start" /><select className="mt-2 w-full rounded-lg border border-[#dfe7e1] bg-white p-3" value={startMode} onChange={(e) => setStartMode(e.target.value)}><option value="now">Start now</option><option value="scheduled">Scheduled start</option></select>{startMode === "scheduled" && <><Label text="Start date" /><Input value={startDate} onChange={setStartDate} type="datetime-local" /></>}<Label text="Optional end date" /><Input value={endDate} onChange={setEndDate} type="datetime-local" /></Step>}
        {step === 4 && <Step title="Review"><Review label="Receiver" value={receiver || "-"} /><Review label="Wallet USDC" value={`${formatUsdc(usdc.balance)} USDC`} /><Review label="Rate" value={`${amount} USDC / ${unit}`} /><Review label="Per second" value={`${rate.toString()} micro-USDC`} /><Review label="Maximum spend" value={`${formatUsdc(deposit)} USDC`} /><Review label="Monthly estimate" value={`${formatUsdc(budgetAnalysis.estimatedMonthlyOutflow)} USDC`} /><Review label="Remaining after funding" value={`${formatUsdc(budgetAnalysis.remainingFreeBalance)} USDC`} /><Review label="Approval" value="Exact amount only" />{budgetAnalysis.warnings.map((warning) => <p className="mt-3 rounded-lg border border-[#f0d18a] bg-[#fff8e6] p-3 text-sm text-[#725000]" key={warning.code}>{warning.message}</p>)}{!scheduleValid && <p className="mt-3 rounded-lg border border-[#f0d18a] bg-[#fff8e6] p-3 text-sm text-[#725000]">The selected end date must be later than the start date.</p>}</Step>}
        {step === 5 && <Step title="Plan review"><p className="text-[#66736d]">Review the Plan impact first. Approval and stream creation happen only after you confirm on the review page.</p><button disabled={!valid || submitting} onClick={submit} className="btn btn-primary mt-5 w-full">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Review Plan</button></Step>}
      </section>
      <div className="mt-5 flex justify-between">
        <button className="btn btn-secondary" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</button>
        <button className="btn btn-primary" disabled={step === 5} onClick={() => setStep((s) => Math.min(5, s + 1))}>Next</button>
      </div>
    </main>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="text-2xl font-black">{title}</h2><div className="mt-5">{children}</div></div>;
}

function Label({ text }: { text: string }) {
  return <label className="mt-4 block text-sm font-bold text-[#506058]">{text}</label>;
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <input className="mt-2 w-full rounded-lg border border-[#dfe7e1] bg-white p-3 outline-[#107c5c]" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}

function Review({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between border-b border-[#dfe7e1] py-3 text-sm"><span className="text-[#66736d]">{label}</span><span className="max-w-[60%] break-all text-right font-bold">{value}</span></div>;
}
