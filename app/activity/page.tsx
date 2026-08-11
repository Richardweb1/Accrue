"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { EmptyState } from "@/components/empty-state";
import { ARC_EXPLORER_URL } from "@/lib/env";
import { shortAddress } from "@/lib/format";
import { getInstantSendActivity } from "@/lib/instant-send/storage";
import type { InstantSendActivity } from "@/types/plan";

export default function ActivityPage() {
  const { address } = useAccount();
  const [items, setItems] = useState<InstantSendActivity[]>([]);

  useEffect(() => {
    setItems(getInstantSendActivity(address));
  }, [address]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-4xl font-black">Activity</h1>
      <p className="mt-2 text-[#66736d]">Stream events appear from Arc reads. Instant Send activity is stored locally in this browser.</p>
      {items.length ? (
        <div className="mt-6 grid gap-3">
          {items.map((item) => (
            <article className="panel p-4" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-[#107c5c]">Instant Send</p>
                  <h2 className="mt-1 text-xl font-black">{item.amount} USDC to {shortAddress(item.recipient)}</h2>
                  {item.memo && <p className="mt-2 text-sm text-[#66736d]">{item.memo}</p>}
                </div>
                <a className="btn btn-secondary text-sm" href={`${ARC_EXPLORER_URL}/tx/${item.hash}`} target="_blank">ArcScan</a>
              </div>
              <p className="mt-3 text-xs text-[#66736d]">{new Date(item.createdAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6"><EmptyState title="No local activity yet" copy="Create a stream or use Instant Send on Arc testnet to see activity here." /></div>
      )}
    </main>
  );
}
