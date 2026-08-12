import type { PlanTemplate } from "@/types/plan";

export const planTemplates: PlanTemplate[] = [
  {
    id: "support",
    title: "Family Support",
    description: "Send USDC gradually to a parent, family member, or friend.",
    prompt: "Send my sister 40 USDC every week."
  },
  {
    id: "allowance",
    title: "Monthly Allowance",
    description: "Create a predictable allowance with a clear maximum spend.",
    prompt: "Give my nephew 30 USDC over the next month."
  },
  {
    id: "pay_someone",
    title: "Pay Someone Over Time",
    description: "Pay a tutor, assistant, service provider, or worker gradually.",
    prompt: "Pay my assistant 75 USDC over two weeks."
  },
  {
    id: "pay_someone",
    title: "Freelancer Payment",
    description: "Fund work over time while retaining pause and cancel controls.",
    prompt: "Pay a designer 120 USDC over three milestones."
  },
  {
    id: "creator_support",
    title: "Creator Support",
    description: "Support a creator with a capped weekly or monthly flow.",
    prompt: "Send a streamer 12 USDC over four weeks."
  },
  {
    id: "donation",
    title: "Donation Stream",
    description: "Donate gradually with a transparent maximum budget.",
    prompt: "Donate 20 USDC to a community fund over a month."
  },
  {
    id: "savings",
    title: "Savings Goal",
    description: "Move USDC toward another wallet you control. No yield or custody claims.",
    prompt: "Save 300 USDC by the end of the year."
  },
  {
    id: "custom",
    title: "Custom Plan",
    description: "Build a payment Plan with your own receiver, amount, and timeline.",
    prompt: "Pay someone 80 USDC gradually instead of all at once."
  }
];
