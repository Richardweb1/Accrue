"use client";

import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useUserStreams, useLiveAccrued } from "@/hooks/use-streams";
import { useStreamActions } from "@/hooks/use-stream-actions";
import { streamStatus } from "@/components/stream-card";
import { formatUsdc, shortAddress } from "@/lib/format";
import { ACCRUE_CONTRACT_ADDRESS, ARC_EXPLORER_URL } from "@/lib/env";

export default function StreamDetailsPage() {
  const params = useParams<{ streamId: string }>();
  const id = BigInt(params.streamId);
  const { streams, refetch } = useUserStreams();
  const stream = streams.find((item) => item.id === id);
  const live = useLiveAccrued(stream);
  const actions = useStreamActions();

  async function run(action: "claim" | "pauseStream" | "resumeStream" | "cancelStream") {
    try {
      if (action === "cancelStream" && stream && !window.confirm(`Cancel stream? Receiver keeps ${formatUsdc(live - stream.claimedAmount)} USDC accrued. Refundable estimate: ${formatUsdc(stream.depositedAmount - live)} USDC.`)) return;
      await actions.callStreamAction(action, id);
      toast.success("Transaction submitted");
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    }
  }

  if (!stream) {
    return <main className="mx-auto max-w-4xl px-4 py-8"><h1 className="text-3xl font-black">Stream #{params.streamId}</h1><div className="panel mt-6 p-6 text-[#66736d]">Connect the related wallet or confirm the contract address is configured.</div></main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold text-[#66736d]">{streamStatus(stream)}</p><h1 className="text-4xl font-black">Stream #{stream.id.toString()}</h1></div>
        <a className="btn btn-secondary" href={`${ARC_EXPLORER_URL}/address/${ACCRUE_CONTRACT_ADDRESS}`} target="_blank">Contract</a>
      </div>
      <section className="panel mt-6 p-6">
        <p className="text-sm text-[#66736d]">Live accrued estimate</p>
        <div className="mt-2 text-5xl font-black text-[#107c5c]">{formatUsdc(live)} USDC</div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Claimable" value={`${formatUsdc(live - stream.claimedAmount)} USDC`} />
          <Metric label="Deposited" value={`${formatUsdc(stream.depositedAmount)} USDC`} />
          <Metric label="Remaining" value={`${formatUsdc(stream.depositedAmount - live)} USDC`} />
          <Metric label="Claimed" value={`${formatUsdc(stream.claimedAmount)} USDC`} />
          <Metric label="Rate/sec" value={`${stream.ratePerSecond.toString()} micro-USDC`} />
          <Metric label="Receiver" value={shortAddress(stream.receiver)} />
        </div>
      </section>
      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <button className="btn btn-primary" onClick={() => run("claim")}>Claim</button>
        <button className="btn btn-secondary" onClick={() => run("pauseStream")}>Pause</button>
        <button className="btn btn-secondary" onClick={() => run("resumeStream")}>Resume</button>
        <button className="btn btn-secondary" onClick={() => run("cancelStream")}>Cancel</button>
      </section>
      <section className="panel mt-6 p-5">
        <h2 className="text-xl font-black">Event timeline</h2>
        <div className="mt-4 space-y-3 text-sm text-[#66736d]">
          <p>Stream created and funded.</p>
          <p>Pause, resume, claim, funding, completion, and cancellation events appear in Arc logs.</p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-sm text-[#66736d]">{label}</p><p className="mt-1 break-all font-black">{value}</p></div>;
}
