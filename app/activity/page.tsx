import { EmptyState } from "@/components/empty-state";

export default function ActivityPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-black">Activity</h1>
      <p className="mt-2 text-[#66736d]">Contract events and transaction links will populate from Arc logs after deployment.</p>
      <div className="mt-6"><EmptyState title="No activity yet" copy="Create a stream locally or on Arc testnet to see stream events, claims, pauses, resumes, funding, and cancellation." /></div>
    </main>
  );
}
