"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { encodePlanDraft, type PlanDraft } from "@/lib/plans/draft";
import { getTemplateDefinition, paymentTimeline, templateToPlanDraft, validateTemplateDraft, type TemplateDraft, type TemplateField } from "@/lib/plans/guided-templates";
import { loadRecipients, removeRecipient, saveRecipients, upsertRecipient, validateRecipientAddress, type SavedRecipient } from "@/lib/plans/recipients";

const stepLabels = ["Purpose", "Recipient", "Amount", "Schedule", "Safety", "Review"];

export default function GuidedPlanPage() {
  const params = useParams<{ templateId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { address } = useAccount();
  const definition = getTemplateDefinition(params.templateId);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<TemplateDraft>(() => prefillFromSearch(search));
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientLabel, setRecipientLabel] = useState("");

  useEffect(() => {
    setRecipients(loadRecipients(address));
  }, [address]);

  const errors = useMemo(() => definition ? validateTemplateDraft(definition, draft, address) : {}, [address, definition, draft]);
  const planDraft = useMemo(() => {
    if (!definition || Object.keys(errors).length > 0) return undefined;
    return templateToPlanDraft(definition, draft);
  }, [definition, draft, errors]);

  if (!definition) {
    return <main className="mx-auto max-w-4xl px-4 py-8"><div className="panel p-6">Unknown Plan template.</div></main>;
  }

  function update(name: string, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function chooseRecipient(recipient: SavedRecipient) {
    update("receiver", recipient.address);
    if (!draft.recipientName && !draft.creatorName && !draft.causeName) update("recipientName", recipient.displayName);
  }

  function saveRecipient() {
    if (!address || !isAddress(draft.receiver || "")) return;
    const error = validateRecipientAddress(draft.receiver, address);
    if (error) return;
    const next = upsertRecipient(address, recipients, {
      displayName: recipientName || draft.recipientName || draft.creatorName || draft.causeName || "Saved Recipient",
      address: draft.receiver as `0x${string}`,
      label: recipientLabel
    });
    setRecipients(next);
    saveRecipients(address, next);
    setRecipientName("");
    setRecipientLabel("");
  }

  function deleteRecipient(id: string) {
    const next = removeRecipient(recipients, id);
    setRecipients(next);
    saveRecipients(address, next);
  }

  function review() {
    if (!planDraft) return;
    router.push(`/plans/review?draft=${encodePlanDraft(planDraft)}`);
  }

  const visibleFields = fieldsForStep(definition.fields, step);
  const timeline = planDraft ? paymentTimeline(planDraft) : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm font-black uppercase text-[#107c5c]">Guided Plan</p>
      <h1 className="mt-2 text-4xl font-black">{definition.title}</h1>
      <p className="mt-3 text-[#66736d]">{definition.description}</p>
      {definition.disclaimer && <p className="mt-4 rounded-lg border border-[#dfe7e1] bg-white p-3 text-sm text-[#506058]">{definition.disclaimer}</p>}

      <div className="mt-6 grid grid-cols-6 gap-2">
        {stepLabels.map((label, index) => <button key={label} className={`h-2 rounded-full ${index <= step ? "bg-[#107c5c]" : "bg-[#dfe7e1]"}`} onClick={() => setStep(index)} aria-label={label} />)}
      </div>

      <section className="panel mt-6 p-5">
        <h2 className="text-2xl font-black">{stepLabels[step]}</h2>
        <div className="mt-5 grid gap-4">
          {visibleFields.map((field) => <Field key={field.name} field={field} value={draft[field.name] || ""} error={errors[field.name]} onChange={(value) => update(field.name, value)} />)}
        </div>

        {step === 1 && (
          <div className="mt-6">
            <h3 className="font-black">Saved recipients</h3>
            <div className="mt-3 grid gap-3">
              {recipients.map((recipient) => (
                <div className="flex items-center justify-between rounded-lg border border-[#dfe7e1] bg-white p-3" key={recipient.id}>
                  <button className="text-left" onClick={() => chooseRecipient(recipient)}>
                    <p className="font-bold">{recipient.displayName}</p>
                    <p className="text-xs text-[#66736d]">{recipient.address}</p>
                  </button>
                  <button aria-label="Remove recipient" onClick={() => deleteRecipient(recipient.id)}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {recipients.length === 0 && <p className="text-sm text-[#66736d]">No saved recipients yet.</p>}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input className="rounded-lg border border-[#dfe7e1] p-3" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Display name" />
              <input className="rounded-lg border border-[#dfe7e1] p-3" value={recipientLabel} onChange={(event) => setRecipientLabel(event.target.value)} placeholder="Label" />
              <button className="btn btn-secondary" onClick={saveRecipient}><Plus className="h-4 w-4" /> Save</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="mt-6">
            <h3 className="font-black">Payment timeline</h3>
            <div className="mt-3 grid gap-3">
              {timeline.map((item) => <div className="rounded-lg border border-[#dfe7e1] bg-white p-3" key={item.label}><p className="font-bold">{item.label}</p><p className="text-sm text-[#66736d]">{item.text}</p></div>)}
            </div>
            {Object.values(errors).map((error) => <p className="mt-3 rounded-lg border border-[#efaaa3] bg-[#fff1ef] p-3 text-sm text-[#8a1f13]" key={error}>{error}</p>)}
          </div>
        )}
      </section>

      <div className="mt-5 flex justify-between">
        <button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
        {step < 5 ? <button className="btn btn-primary" onClick={() => setStep((current) => Math.min(5, current + 1))}>Next <ArrowRight className="h-4 w-4" /></button> : <button className="btn btn-primary" disabled={!planDraft} onClick={review}>Review Plan</button>}
      </div>
    </main>
  );
}

function Field({ field, value, error, onChange }: { field: TemplateField; value: string; error?: string; onChange: (value: string) => void }) {
  if (field.type === "duration") return <TextField label={field.label} value={value} error={error} placeholder="10 days" onChange={onChange} />;
  if (field.type === "rate") return <TextField label={field.label} value={value} error={error} placeholder="2 USDC per day" onChange={onChange} />;
  if (field.type === "textarea") {
    return <label className="block text-sm font-bold text-[#506058]">{field.label}<textarea className="mt-2 min-h-24 w-full rounded-lg border border-[#dfe7e1] p-3 outline-[#107c5c]" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  return <TextField label={field.label} value={value} error={error} placeholder={field.placeholder || (field.type === "address" ? "0x..." : undefined)} type={field.type === "date" ? "date" : "text"} onChange={onChange} />;
}

function TextField({ label, value, error, placeholder, type = "text", onChange }: { label: string; value: string; error?: string; placeholder?: string; type?: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold text-[#506058]">{label}<input className="mt-2 w-full rounded-lg border border-[#dfe7e1] p-3 outline-[#107c5c]" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />{error && <span className="mt-2 block text-sm text-[#8a1f13]">{error}</span>}</label>;
}

function fieldsForStep(fields: TemplateField[], step: number) {
  if (step === 0) return fields.filter((field) => ["purpose", "goalName", "title", "note"].includes(field.name));
  if (step === 1) return fields.filter((field) => ["recipientName", "creatorName", "causeName", "receiver"].includes(field.name));
  if (step === 2) return fields.filter((field) => ["totalAmount"].includes(field.name));
  if (step === 3) return fields.filter((field) => ["duration", "targetDate", "rate", "startDate", "endDate"].includes(field.name));
  if (step === 4) return fields.filter((field) => ["reserveAmount"].includes(field.name));
  return fields;
}

function prefillFromSearch(search: URLSearchParams): TemplateDraft {
  return {
    totalAmount: search.get("amount") || "",
    duration: search.get("duration") || "",
    receiver: search.get("receiver") || "",
    note: search.get("description") || ""
  };
}
