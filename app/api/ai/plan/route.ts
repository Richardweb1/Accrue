import { NextResponse } from "next/server";
import { z } from "zod";
import { planWithProvider } from "@/lib/ai/provider";
import { plannerResponseSchema } from "@/lib/ai/schema";

const requestSchema = z.object({
  prompt: z.string().min(3).max(500)
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a payment goal first." }, { status: 400 });
  }

  const response = await planWithProvider(parsed.data.prompt);
  const safeResponse = plannerResponseSchema.parse(response);
  return NextResponse.json(safeResponse);
}
