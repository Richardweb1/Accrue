import { NextResponse } from "next/server";
import type { AISendConfirmation } from "@/types/plan";

// Verify this slug is still valid at https://openrouter.ai/models before deploying; OpenRouter model slugs change over time.
const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://accrue-web1.vercel.app";

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

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OpenRouter AI confirmation skipped: missing OPENROUTER_API_KEY.");
    return NextResponse.json(fallback(body.amount, body.recipient));
  }

  const prompt = `Return strict JSON only with keys summary, riskFlag, riskNote. Transfer: recipient ${body.recipient}, amount ${body.amount} USDC, sentBefore ${Boolean(body.sentBefore)}, balancePercent ${body.balancePercent ?? 0}. riskFlag must be none, first_time_address, or large_amount. Do not include secrets, markdown, or extra text.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": SITE_URL,
        "X-Title": "Accrue"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        max_tokens: 240,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("OpenRouter AI confirmation failed:", response.status, errorText);
      return NextResponse.json(fallback(body.amount, body.recipient));
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content;
    const parsed = typeof text === "string" ? parseConfirmation(text) : undefined;
    if (!parsed) console.error("OpenRouter AI confirmation parsing failed:", text);
    return NextResponse.json(parsed ?? fallback(body.amount, body.recipient));
  } catch (error) {
    console.error("OpenRouter AI confirmation request errored:", error);
    return NextResponse.json(fallback(body.amount, body.recipient));
  }
}
