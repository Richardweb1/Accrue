import assert from "node:assert/strict";
import test from "node:test";
import { getTemplateDefinition, paymentTimeline, templateDefinitions, templateToPlanDraft, validateTemplateDraft } from "@/lib/plans/guided-templates";
import { planHealth } from "@/lib/plans/health";
import { recipientsKey, removeRecipient, validateRecipientAddress } from "@/lib/plans/recipients";

const receiver = "0x0000000000000000000000000000000000000002";
const sender = "0x0000000000000000000000000000000000000001";

test("all required guided templates exist", () => {
  assert.deepEqual(templateDefinitions.map((template) => template.id), ["family-support", "allowance", "pay-someone", "savings-goal", "creator-support", "donation", "custom"]);
});

test("each template converts to canonical Plan draft", () => {
  for (const definition of templateDefinitions) {
    const draft = templateToPlanDraft(definition, sample(definition.id));
    assert.equal(draft.receiver, receiver);
    assert.equal(draft.source, "template");
    assert.ok(draft.totalAmount);
  }
});

test("recipient address validation rejects sender", () => {
  assert.equal(validateRecipientAddress(sender, sender), "Receiver cannot be your connected wallet.");
});

test("template validation rejects sender equals receiver", () => {
  const definition = getTemplateDefinition("family-support")!;
  const errors = validateTemplateDraft(definition, { ...sample("family-support"), receiver: sender }, sender);
  assert.equal(errors.receiver, "Receiver cannot be your connected wallet.");
});

test("generated family title is human-friendly", () => {
  const definition = getTemplateDefinition("family-support")!;
  const { title, ...draft } = sample("family-support");
  void title;
  assert.equal(templateToPlanDraft(definition, draft).title, "Mom Support");
});

test("payment timeline is deterministic", () => {
  const definition = getTemplateDefinition("pay-someone")!;
  const timeline = paymentTimeline(templateToPlanDraft(definition, sample("pay-someone")));
  assert.equal(timeline[0].label, "Today");
  assert.equal(timeline[3].label, "If cancelled");
});

test("savings target-date calculates end date", () => {
  const definition = getTemplateDefinition("savings-goal")!;
  const draft = templateToPlanDraft(definition, { ...sample("savings-goal"), startDate: "2026-01-01", targetDate: "2026-01-31", duration: "" });
  assert.ok((draft.endTime || 0) > draft.startTime);
});

test("allowance wording says funded period", () => {
  const definition = getTemplateDefinition("allowance")!;
  assert.match(definition.disclaimer || "", /currently funded period/);
});

test("AI prefill-like search draft validates after receiver is added", () => {
  const definition = getTemplateDefinition("family-support")!;
  const errors = validateTemplateDraft(definition, { ...sample("family-support"), totalAmount: "100", duration: "30 days" }, sender);
  assert.equal(Object.keys(errors).length, 0);
});

test("recipient storage helpers create stable owner key and remove", () => {
  assert.equal(recipientsKey(sender), `accrue:recipients:${sender}`);
  assert.equal(removeRecipient([{ id: "1", owner: sender, displayName: "Mom", address: receiver, createdAt: 1 }], "1").length, 0);
});

test("plan health labels draft without stream", () => {
  assert.equal(planHealth(), "Draft");
});

function sample(templateId: string) {
  return {
    recipientName: "Mom",
    creatorName: "Creator",
    causeName: "Cause",
    goalName: "Emergency Savings",
    purpose: "Tutoring Payment",
    title: "Custom Plan",
    receiver,
    totalAmount: "10",
    duration: "10 days",
    rate: "1 USDC per day",
    startDate: "2026-01-01",
    targetDate: templateId === "savings-goal" ? "2026-02-01" : "",
    reserveAmount: "0",
    note: "Test"
  };
}
