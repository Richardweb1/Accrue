"use client";

import Link from "next/link";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { StreamWithId, useLiveAccrued } from "@/hooks/use-streams";
import { formatUsdc, shortAddress } from "@/lib/format";

export function streamStatus(stream: StreamWithId) {
  const now = Math.floor(Date.now() / 1000);
  if (stream.cancelled) return "Cancelled";
  if (stream.paused) return "Paused";
  if (now < stream.startTime) return "Scheduled";
  if (stream.claimedAmount >= stream.depositedAmount) return "Depleted";
  if (stream.endTime && now >= stream.endTime) return "Completed";
  return "Active";
}

export function StreamCard({ stream }: { stream: StreamWithId }) {
  const live = useLiveAccrued(stream);
  const progress = Number((live * 10000n) / (stream.depositedAmount || 1n)) / 100;
  const status = streamStatus(stream);
  return (
    <article className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[#66736d]">Stream #{stream.id.toString()}</p>
          <h3 className="mt-1 text-lg font-black">{formatUsdc(live)} USDC accrued</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#dfe7e1] px-2.5 py-1 text-xs font-bold">
          {status === "Paused" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {status}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7eee9]">
        <div className="h-full bg-[#107c5c]" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-[#66736d]">Claimable</dt><dd className="font-bold">{formatUsdc(live - stream.claimedAmount)} USDC</dd></div>
        <div><dt className="text-[#66736d]">Deposited</dt><dd className="font-bold">{formatUsdc(stream.depositedAmount)} USDC</dd></div>
        <div><dt className="text-[#66736d]">Sender</dt><dd className="font-bold">{shortAddress(stream.sender)}</dd></div>
        <div><dt className="text-[#66736d]">Receiver</dt><dd className="font-bold">{shortAddress(stream.receiver)}</dd></div>
      </dl>
      <Link className="btn btn-secondary mt-4 w-full" href={`/streams/${stream.id.toString()}`}>
        View details <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
