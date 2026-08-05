import assert from "node:assert/strict";
import test from "node:test";
import { encodeAbiParameters, numberToHex, pad, parseUnits, toEventSelector } from "viem";
import { needsApproval } from "@/lib/plans/approval";
import { planDraftSchema, draftToAccruePlan, type PlanDraft } from "@/lib/plans/draft";
import { analyzeBudget, calculateEndTime, rateAmountToPerSecond } from "@/lib/plans/calculations";
import { extractStreamIdFromReceipt } from "@/lib/plans/events";
import { fallbackPlanTitle, metadataKey } from "@/lib/plans/metadata";
import { planToContractParams, validatePlanReview } from "@/lib/plans/stream-conversion";

test("converts daily USDC rate to micro-USDC per second", () => {
  assert.equal(rateAmountToPerSecond("2", "day"), 23n);
});

test("detects minimum precision underflow", () => {
  assert.equal(rateAmountToPerSecond("0.000001", "day"), 0n);
});

test("calculates completion time from budget and rate", () => {
  const start = 1_000;
  assert.equal(calculateEndTime(start, 100n, 10n), 1_010);
});

test("blocks over-commitment", () => {
  const analysis = analyzeBudget({
    walletBalance: parseUnits("10", 6),
    activeCommitments: parseUnits("3", 6),
    newCommitment: parseUnits("8", 6),
    reserveAmount: 0n,
    ratePerSecond: 1n,
    startTime: 1_000
  });
  assert.equal(analysis.canCreate, false);
  assert.equal(analysis.warnings.some((warning) => warning.code === "over_commitment"), true);
});

test("validates a Plan draft", () => {
  const draft = sampleDraft();
  assert.equal(planDraftSchema.safeParse(draft).success, true);
});

test("rejects invalid receiver draft", () => {
  assert.equal(planDraftSchema.safeParse({ ...sampleDraft(), receiver: "not-wallet" }).success, false);
});

test("rejects invalid dates", () => {
  assert.equal(planDraftSchema.safeParse({ ...sampleDraft(), endTime: 999 }).success, false);
});

test("converts template draft to contract parameters", () => {
  const plan = draftToAccruePlan({ ...sampleDraft(), source: "template" });
  const params = planToContractParams(plan);
  assert.equal(params.receiver, sampleDraft().receiver);
  assert.equal(params.depositAmount, parseUnits("10", 6));
  assert.equal(params.endTime, 2000n);
});

test("detects reserve warning", () => {
  const plan = draftToAccruePlan({ ...sampleDraft(), reserveAmount: "5" });
  const analysis = validatePlanReview(plan, parseUnits("12", 6), 0n);
  assert.equal(analysis.warnings.some((warning) => warning.code === "low_reserve"), true);
});

test("approval decision skips sufficient allowance", () => {
  assert.equal(needsApproval(10n, 10n), false);
});

test("approval decision requires insufficient allowance", () => {
  assert.equal(needsApproval(10n, 9n), true);
});

test("decodes StreamCreated event from receipt", () => {
  const topics = [
    toEventSelector("StreamCreated(uint256,address,address,uint256,uint256,uint256,uint256)"),
    pad(numberToHex(42n)),
    pad("0x0000000000000000000000000000000000000001"),
    pad("0x0000000000000000000000000000000000000002")
  ];
  const data = encodeAbiParameters(
    [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
    [10n, 1n, 1000n, 2000n]
  );
  const receipt = { logs: [{ topics, data, address: "0x0000000000000000000000000000000000000003", blockHash: "0x", blockNumber: 1n, transactionHash: "0x", transactionIndex: 0, logIndex: 0, removed: false }] };
  assert.equal(extractStreamIdFromReceipt(receipt as never), 42n);
});

test("metadata key is chain-contract-stream unique", () => {
  assert.equal(metadataKey(1, "0xABC0000000000000000000000000000000000000", 7n), "accrue:plan:1:0xabc0000000000000000000000000000000000000:7");
});

test("metadata fallback title", () => {
  assert.equal(fallbackPlanTitle(7n), "Payment Plan #7");
});

function sampleDraft(): PlanDraft {
  return {
    source: "manual",
    planType: "support",
    title: "Family Support",
    receiver: "0x0000000000000000000000000000000000000002",
    totalAmount: "10",
    displayRateAmount: "1",
    displayRateUnit: "day",
    startTime: 1000,
    endTime: 2000,
    reserveAmount: "0"
  };
}
