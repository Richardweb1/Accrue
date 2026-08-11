import { NextResponse } from "next/server";
import type { AISendConfirmation } from "@/types/plan";

function fallback(amount: string, recipient: string): AISendConfirmation {
  return {
    summary: `Send ${amount} USDC to ${recipient.slice(0, 6)}...${recipient.slice(-4)}.`,
    riskFlag: "none",
    riskNote: ""
  };
}

function parseConfirmation(text: string): AISendConfirmation | undefined {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as AISendConfirmation;
    if (!parsed.summary || !["none", "first_time_address", "large_amount"].includes(parsed.riskFlag)) return undefined;
    return {
      summary: parsed.summary,
      riskFlag: parsed.riskFlag,
      riskNote: parsed.riskFlag === "none" ? "" : parsed.riskNote || "Review this transfer before signing."
    };
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined) as {
    recipient?: string;
    amount?: string;
    sentBefore?: boolean;
    balancePercent?: number;
  } | undefined;

  if (!body?.recipient || !body.amount) {
    return NextResponse.json(fallback("0", "0x0000000000000000000000000000000000000000"));
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 240,
        messages: [{
          role: "user",
          content: `Return strict JSON only with keys summary, riskFlag, riskNote. Transfer: recipient ${body.recipient}, amount ${body.amount} USDC, sentBefore ${Boolean(body.sentBefore)}, balancePercent ${body.balancePercent ?? 0}. riskFlag must be none, first_time_address, or large_amount. Do not include secrets, markdown, or extra text.`
        }]
      })
    });
    const json = await response.json();
    const text = json?.content?.[0]?.text;
    const parsed = typeof text === "string" ? parseConfirmation(text) : undefined;
    return NextResponse.json(parsed ?? fallback(body.amount, body.recipient));
  } catch {
    return NextResponse.json(fallback(body.amount, body.recipient));
  }
}
