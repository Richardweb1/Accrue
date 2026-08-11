export type PlanType =
  | "pay_someone"
  | "support"
  | "allowance"
  | "creator_support"
  | "donation"
  | "savings"
  | "pay_as_you_use"
  | "custom";

export type DisplayRateUnit = "minute" | "hour" | "day" | "week" | "month";

export type PlanStatus = "draft" | "ready" | "funding" | "active" | "paused" | "completed" | "cancelled";

export type AccruePlan = {
  id: string;
  owner?: `0x${string}`;
  planType: PlanType;
  title: string;
  description?: string;
  receiver?: `0x${string}`;
  streamId?: bigint;
  totalBudget: bigint;
  ratePerSecond: bigint;
  displayRateAmount: string;
  displayRateUnit: DisplayRateUnit;
  startTime: number;
  endTime?: number;
  reserveAmount?: bigint;
  status: PlanStatus;
  createdAt: number;
  explanation?: string;
};

export type PlanTemplate = {
  id: PlanType;
  title: string;
  description: string;
  prompt: string;
};

export type BudgetWarning = {
  code:
    | "low_reserve"
    | "over_commitment"
    | "existing_commitments"
    | "long_term"
    | "small_rate"
    | "invalid_schedule"
    | "self_receiver";
  severity: "info" | "warning" | "blocking";
  message: string;
};

export type BudgetAnalysis = {
  walletBalance: bigint;
  activeCommitments: bigint;
  newCommitment: bigint;
  reserveAmount: bigint;
  remainingFreeBalance: bigint;
  estimatedMonthlyOutflow: bigint;
  estimatedCompletionDate?: number;
  warnings: BudgetWarning[];
  canCreate: boolean;
};

export type RecentRecipient = {
  owner: `0x${string}`;
  address: `0x${string}`;
  lastSentAt: number;
};

export type AISendConfirmation = {
  summary: string;
  riskFlag: "none" | "first_time_address" | "large_amount";
  riskNote: string;
};

export type InstantSendActivity = {
  id: string;
  owner: `0x${string}`;
  recipient: `0x${string}`;
  amount: string;
  memo?: string;
  hash: `0x${string}`;
  createdAt: number;
};
