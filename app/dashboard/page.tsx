"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAccount } from "wagmi";
import { EmptyState } from "@/components/empty-state";
import { StreamCard } from "@/components/stream-card";
import { useUserStreams } from "@/hooks/use-streams";
import { formatUsdc } from "@/lib/format";

export default function Dashboard() {
  const { address } = useAccount();
  const { streams, incomingIds, outgoingIds, isLoading } = useUserStreams();
  const totalClaimable = streams.filter((s) => s.receiver.toLowerCase() === address?.toLowerCase()).reduce((sum, s) => sum + s.claimable, 0n);
  const totalDeposited = streams.reduce((sum, s) => sum + s.depositedAmount, 0n);
  const totalClaimed = streams.reduce((sum, s) => sum + s.claimedAmount, 0n);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold text-[#66736d]">Arc Testnet</p><h1 className="text-4xl font-black">Dashboard</h1></div>
        <Link className="btn btn-primary" href="/streams/create"><Plus className="h-4 w-4" /> Create Stream</Link>
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Total claimable" value={`${formatUsdc(totalClaimable)} USDC`} />
        <Metric label="Active outgoing" value={outgoingIds.length.toString()} />
        <Metric label="Active incoming" value={incomingIds.length.toString()} />
        <Metric label="Total deposited" value={`${formatUsdc(totalDeposited)} USDC`} />
        <Metric label="Total claimed" value={`${formatUsdc(totalClaimed)} USDC`} />
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-black">Your streams</h2>
        {isLoading ? <div className="panel mt-4 h-48 animate-pulse" /> : streams.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{streams.map((stream) => <StreamCard key={stream.id.toString()} stream={stream} />)}</div> : <div className="mt-4"><EmptyState title="No streams yet" copy="Connect a wallet and create your first programmable USDC stream." /></div>}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="panel p-4"><p className="text-sm text-[#66736d]">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}
