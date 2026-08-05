import type { PlanTemplate } from "@/types/plan";

export const planTemplates: PlanTemplate[] = [
  {
    id: "support",
    title: "Family Support",
    description: "Send USDC gradually to a parent, family member, or friend.",
    prompt: "Support my mother with 100 USDC over one month."
  },
  {
    id: "allowance",
    title: "Monthly Allowance",
    description: "Create a predictable allowance with a clear maximum spend.",
    prompt: "Give my child an allowance of 1 USDC per day."
  },
  {
    id: "pay_someone",
    title: "Pay Someone Over Time",
    description: "Pay a tutor, assistant, service provider, or worker gradually.",
    prompt: "Pay my tutor 50 USDC over ten days."
  },
  {
    id: "pay_someone",
    title: "Freelancer Payment",
    description: "Fund work over time while retaining pause and cancel controls.",
    prompt: "Pay a freelancer 80 USDC over eight days."
  },
  {
    id: "creator_support",
    title: "Creator Support",
    description: "Support a creator with a capped weekly or monthly flow.",
    prompt: "Support a creator with 5 USDC every week."
  },
  {
    id: "donation",
    title: "Donation Stream",
    description: "Donate gradually with a transparent maximum budget.",
    prompt: "Donate 0.25 USDC per day."
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
