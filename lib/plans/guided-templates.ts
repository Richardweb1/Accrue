import { z } from "zod";
import { isAddress } from "viem";
import type { DisplayRateUnit, PlanType } from "@/types/plan";
import type { PlanDraft } from "@/lib/plans/draft";

export type TemplateField =
  | { name: string; label: string; type: "text" | "address" | "amount" | "textarea" | "date"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "duration"; required?: boolean }
  | { name: string; label: string; type: "rate"; required?: boolean };

export type TemplateDefinition = {
  id: string;
  planType: PlanType;
  title: string;
  description: string;
  disclaimer?: string;
  fields: TemplateField[];
};

export type TemplateDraft = Record<string, string>;

export const templateDefinitions: TemplateDefinition[] = [
  {
    id: "family-support",
    planType: "support",
    title: "Family Support",
    description: "Support a family member with a funded USDC Plan.",
    fields: [
      { name: "recipientName", label: "Recipient name", type: "text", required: true, placeholder: "Mom" },
      { name: "receiver", label: "Receiver wallet", type: "address", required: true },
      { name: "totalAmount", label: "Total USDC amount", type: "amount", required: true },
      { name: "duration", label: "Duration", type: "duration", required: true },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "reserveAmount", label: "Preferred reserve amount", type: "amount" },
      { name: "note", label: "Optional note", type: "textarea" }
    ]
  },
  {
    id: "allowance",
    planType: "allowance",
    title: "Allowance",
    description: "Create an allowance for a currently funded period.",
    disclaimer: "This Plan covers the currently funded period.",
    fields: [
      { name: "recipientName", label: "Recipient name", type: "text", required: true },
      { name: "receiver", label: "Receiver wallet", type: "address", required: true },
      { name: "totalAmount", label: "Funded amount", type: "amount", required: true },
      { name: "duration", label: "Funded duration", type: "duration", required: true },
      { name: "rate", label: "Human-friendly rate", type: "rate" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "note", label: "Optional note", type: "textarea" }
    ]
  },
  {
    id: "pay-someone",
    planType: "pay_someone",
    title: "Pay Someone Over Time",
    description: "Pay a person gradually with a clear maximum budget.",
    fields: [
      { name: "purpose", label: "Purpose", type: "text", required: true, placeholder: "Tutoring Payment" },
      { name: "recipientName", label: "Recipient name", type: "text", required: true },
      { name: "receiver", label: "Receiver wallet", type: "address", required: true },
      { name: "totalAmount", label: "Total amount", type: "amount", required: true },
      { name: "duration", label: "Duration", type: "duration", required: true },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "note", label: "Optional note", type: "textarea" }
    ]
  },
  {
    id: "savings-goal",
    planType: "savings",
    title: "Savings Goal",
    description: "Move funded USDC gradually to a destination wallet you choose.",
    disclaimer: "Accrue gradually transfers funded USDC to the selected destination. It does not provide yield or investment returns.",
    fields: [
      { name: "goalName", label: "Goal name", type: "text", required: true, placeholder: "Emergency Savings" },
      { name: "totalAmount", label: "Target amount", type: "amount", required: true },
      { name: "targetDate", label: "Target date", type: "date" },
      { name: "duration", label: "Or duration", type: "duration" },
      { name: "receiver", label: "Destination wallet", type: "address", required: true },
      { name: "reserveAmount", label: "Preferred reserve amount", type: "amount" },
      { name: "note", label: "Optional note", type: "textarea" }
    ]
  },
  {
    id: "creator-support",
    planType: "creator_support",
    title: "Creator Support",
    description: "Support a creator for a currently funded period.",
    fields: [
      { name: "creatorName", label: "Creator name", type: "text", required: true },
      { name: "receiver", label: "Receiver wallet", type: "address", required: true },
      { name: "totalAmount", label: "Total support amount", type: "amount", required: true },
      { name: "duration", label: "Duration", type: "duration", required: true },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "note", label: "Optional message", type: "textarea" }
    ]
  },
  {
    id: "donation",
    planType: "donation",
    title: "Donation",
    description: "Donate gradually with a capped USDC budget.",
    fields: [
      { name: "causeName", label: "Cause or organization name", type: "text", required: true },
      { name: "receiver", label: "Receiver wallet", type: "address", required: true },
      { name: "totalAmount", label: "Total donation", type: "amount", required: true },
      { name: "duration", label: "Duration", type: "duration", required: true },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "note", label: "Optional note", type: "textarea" }
    ]
  },
  {
    id: "custom",
    planType: "custom",
    title: "Custom Plan",
    description: "Build your own funded Accrue Plan.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "receiver", label: "Receiver", type: "address", required: true },
      { name: "totalAmount", label: "Total amount", type: "amount", required: true },
      { name: "rate", label: "Rate", type: "rate" },
      { name: "duration", label: "Or duration", type: "duration" },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "Optional end date", type: "date" },
      { name: "reserveAmount", label: "Reserve amount", type: "amount" },
      { name: "note", label: "Description", type: "textarea" }
    ]
  }
];

const amountSchema = z.string().regex(/^\d+(\.\d{1,6})?$/);
const durationSchema = z.string().regex(/^\d+\s*(day|days|week|weeks|month|months)$/i);

export function getTemplateDefinition(templateId: string): TemplateDefinition | undefined {
  return templateDefinitions.find((template) => template.id === templateId);
}

export function validateTemplateDraft(definition: TemplateDefinition, draft: TemplateDraft, sender?: string) {
  const errors: Record<string, string> = {};
  for (const field of definition.fields) {
    const value = draft[field.name]?.trim() || "";
    if (field.required && !value) errors[field.name] = "This field is required.";
    if (value && field.type === "address" && !isAddress(value)) errors[field.name] = "Enter a valid wallet address.";
    if (value && field.type === "address" && sender && value.toLowerCase() === sender.toLowerCase()) errors[field.name] = "Receiver cannot be your connected wallet.";
    if (value && field.type === "amount" && !amountSchema.safeParse(value).success) errors[field.name] = "Enter a valid USDC amount.";
    if (value && field.type === "duration" && !durationSchema.safeParse(value).success) errors[field.name] = "Use a duration like 10 days or 2 months.";
  }
  if (definition.id === "savings-goal" && !draft.targetDate && !draft.duration) errors.duration = "Choose a target date or duration.";
  if (definition.id === "custom" && !draft.rate && !draft.duration) errors.rate = "Enter a rate or duration.";
  return errors;
}

export function templateToPlanDraft(definition: TemplateDefinition, draft: TemplateDraft): PlanDraft {
  const now = Math.floor(Date.now() / 1000);
  const startTime = draft.startDate ? Math.floor(new Date(draft.startDate).getTime() / 1000) : now;
  const durationDays = draft.targetDate ? Math.max(1, Math.ceil((Math.floor(new Date(draft.targetDate).getTime() / 1000) - startTime) / 86400)) : parseDurationDays(draft.duration || "30 days");
  const rate = parseRate(draft.rate, draft.totalAmount, durationDays);
  const title = draft.title || generatePlanTitle(definition, draft);
  return {
    source: "template",
    templateId: definition.id,
    planType: definition.planType,
    title,
    description: draft.note || definition.description,
    explanation: definition.disclaimer || `You are creating ${title} for a currently funded period.`,
    receiver: draft.receiver as `0x${string}`,
    totalAmount: draft.totalAmount,
    displayRateAmount: rate.amount,
    displayRateUnit: rate.unit,
    startTime,
    endTime: draft.endDate ? Math.floor(new Date(draft.endDate).getTime() / 1000) : startTime + durationDays * 86400,
    reserveAmount: draft.reserveAmount || "0"
  };
}

export function parseDurationDays(value: string): number {
  const match = value.toLowerCase().match(/(\d+)\s*(day|days|week|weeks|month|months)/);
  if (!match) return 30;
  const amount = Number(match[1]);
  if (match[2].startsWith("week")) return amount * 7;
  if (match[2].startsWith("month")) return amount * 30;
  return amount;
}

export function parseRate(rate: string | undefined, totalAmount: string, durationDays: number): { amount: string; unit: DisplayRateUnit } {
  const match = rate?.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(?:usdc)?\s*(?:per|\/)\s*(day|week|month)/);
  if (match) return { amount: match[1], unit: match[2] as DisplayRateUnit };
  return { amount: trimAmount(Number(totalAmount) / durationDays), unit: "day" };
}

export function generatePlanTitle(definition: TemplateDefinition, draft: TemplateDraft): string {
  const name = draft.recipientName || draft.creatorName || draft.causeName || draft.goalName || draft.purpose;
  if (definition.id === "family-support") return `${name || "Family"} Support`;
  if (definition.id === "allowance") return `${name || "Monthly"} Allowance`;
  if (definition.id === "pay-someone") return draft.purpose || `${name || "Recipient"} Payment`;
  if (definition.id === "savings-goal") return draft.goalName || "Savings Goal";
  if (definition.id === "creator-support") return `${name || "Creator"} Support`;
  if (definition.id === "donation") return `${name || "Donation"} Stream`;
  return draft.title || "Custom Plan";
}

export function paymentTimeline(draft: PlanDraft) {
  return [
    { label: "Today", text: `${draft.totalAmount} USDC is funded.` },
    { label: `Every ${draft.displayRateUnit}`, text: `${draft.displayRateAmount} USDC becomes available.` },
    { label: "Any time", text: "The receiver can claim accrued USDC." },
    { label: "If cancelled", text: "Accrued funds remain available to the receiver. Unused funds return to the sender." }
  ];
}

function trimAmount(value: number): string {
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
