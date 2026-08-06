"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import type { PlannerResponse } from "@/lib/ai/schema";
import { encodePlanDraft, type PlanDraft } from "@/lib/plans/draft";

const examples = [
  "Support my mother with 100 USDC over one month.",
  "Pay my tutor 50 USDC over ten days.",
  "Save 300 USDC by the end of the year."
];

export function PlannerBox() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(examples[0]);
  const [response, setResponse] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setResponse(null);
    try {
      const result = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      setResponse(await result.json());
    } finally {
      setLoading(false);
    }
  }

  function reviewDraft() {
    if (!response?.draft.totalAmount || !response.draft.durationValue || !response.draft.durationUnit) return;
    if (response.missingFields.length > 0) {
      const templateId = response.draft.planType === "support" ? "family-support" : response.draft.planType === "savings" ? "savings-goal" : response.draft.planType === "allowance" ? "allowance" : "pay-someone";
      router.push(`/plans/new/${templateId}?amount=${encodeURIComponent(response.draft.totalAmount)}&duration=${encodeURIComponent(`${response.draft.durationValue} ${response.draft.durationUnit}`)}&description=${encodeURIComponent(response.draft.description || "")}`);
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const days = response.draft.durationUnit === "days" ? response.draft.durationValue : response.draft.durationUnit === "weeks" ? response.draft.durationValue * 7 : response.draft.durationValue * 30;
    const rate = (Number(response.draft.totalAmount) / days).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    const draft: PlanDraft = {
      source: "ai",
      planType: response.draft.planType || "custom",
      title: response.draft.planType === "support" ? "Support Plan" : response.draft.planType === "savings" ? "Savings Plan" : "Payment Plan",
      description: response.draft.description,
      explanation: response.explanation,
      receiver: (response.draft.receiver || "0x0000000000000000000000000000000000000000") as `0x${string}`,
      totalAmount: response.draft.totalAmount,
      displayRateAmount: rate,
      displayRateUnit: "day",
      startTime: now,
      endTime: now + days * 86400,
      reserveAmount: "0"
    };
    router.push(`/plans/review?draft=${encodePlanDraft(draft)}`);
  }

  return (
    <div className="panel float-in p-5">
      <label className="text-sm font-black uppercase text-[#126b7c]">What do you want your money to do?</label>
      <textarea
        className="mt-3 min-h-32 w-full rounded-lg border border-[#cfe7f1] bg-white/85 p-4 text-lg text-[#061d3a] shadow-inner outline-[#45d8c5]"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Support my mother with 100 USDC over the next month."
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Draft Plan
        </button>
        <Link href="/streams/create" className="btn btn-secondary">Create manually</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button className="min-h-11 rounded-full border border-[#cfe7f1] bg-white/70 px-3 py-2 text-sm text-[#445975] transition hover:-translate-y-0.5 hover:border-[#45d8c5]" key={example} onClick={() => setPrompt(example)}>
            {example}
          </button>
        ))}
      </div>
      {response && (
        <div className="mt-5 rounded-lg border border-[#cfe7f1] bg-[#f7fdff] p-4">
          <p className="font-black">{response.status === "ready" ? "Plan draft ready" : "More information needed"}</p>
          <p className="mt-2 text-sm text-[#5f6f89]">{response.message}</p>
          {response.missingFields.length > 0 && <p className="mt-3 text-sm font-bold text-[#8a5a00]">Missing: {response.missingFields.join(", ")}</p>}
          <p className="mt-3 text-sm text-[#445975]">{response.explanation}</p>
          {(response.status === "ready" || response.status === "needs_input") && <button className="btn btn-primary mt-4" onClick={reviewDraft}>{response.status === "ready" ? "Review Plan" : "Continue in guided form"}</button>}
        </div>
      )}
    </div>
  );
}
