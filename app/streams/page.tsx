"use client";

import { EmptyState } from "@/components/empty-state";
import { StreamCard } from "@/components/stream-card";
import { useUserStreams } from "@/hooks/use-streams";

export default function StreamsPage() {
  const { streams, isLoading } = useUserStreams();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-black">Streams</h1>
      <p className="mt-2 text-[#66736d]">Incoming and outgoing streams from the connected wallet.</p>
      {isLoading ? <div className="panel mt-6 h-48 animate-pulse" /> : streams.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{streams.map((stream) => <StreamCard key={stream.id.toString()} stream={stream} />)}</div> : <div className="mt-6"><EmptyState title="No stream history" copy="Streams will appear here after the contract has events for your wallet." /></div>}
    </main>
  );
}
