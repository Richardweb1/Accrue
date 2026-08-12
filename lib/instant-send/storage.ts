import type { InstantSendActivity, RecentRecipient } from "@/types/plan";
import { isAddress } from "viem";

const recipientsKey = (owner: `0x${string}`) => `accrue:instant-send:recipients:${owner.toLowerCase()}`;
const activityKey = (owner: `0x${string}`) => `accrue:instant-send:activity:${owner.toLowerCase()}`;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function getRecentRecipients(owner?: `0x${string}`): RecentRecipient[] {
  if (!owner) return [];
  return readJson<Partial<RecentRecipient>[]>(recipientsKey(owner), [])
    .filter((item): item is RecentRecipient => Boolean(item.address && isAddress(item.address) && item.lastSentAt))
    .map((item) => ({ owner, address: item.address, lastSentAt: item.lastSentAt }));
}

export function saveRecentRecipient(owner: `0x${string}`, address: `0x${string}`) {
  try {
    const current = getRecentRecipients(owner).filter((item) => item.address.toLowerCase() !== address.toLowerCase());
    const next = [{ owner, address, lastSentAt: Date.now() }, ...current].slice(0, 5);
    window.localStorage.setItem(recipientsKey(owner), JSON.stringify(next));
  } catch {
    window.localStorage.removeItem(recipientsKey(owner));
  }
}

export function getInstantSendActivity(owner?: `0x${string}`): InstantSendActivity[] {
  if (!owner) return [];
  return readJson<Partial<InstantSendActivity>[]>(activityKey(owner), [])
    .filter((item): item is InstantSendActivity => Boolean(
      item.id &&
      item.hash &&
      item.hash.startsWith("0x") &&
      item.recipient &&
      isAddress(item.recipient) &&
      item.amount &&
      item.createdAt
    ))
    .map((item) => ({ ...item, owner }));
}

export function saveInstantSendActivity(activity: InstantSendActivity) {
  try {
    const current = getInstantSendActivity(activity.owner);
    const next = [activity, ...current.filter((item) => item.hash !== activity.hash)].slice(0, 20);
    window.localStorage.setItem(activityKey(activity.owner), JSON.stringify(next));
  } catch {
    window.localStorage.removeItem(activityKey(activity.owner));
  }
}
