import type { InstantSendActivity, RecentRecipient } from "@/types/plan";

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
  return readJson<RecentRecipient[]>(recipientsKey(owner), []);
}

export function saveRecentRecipient(owner: `0x${string}`, address: `0x${string}`) {
  const current = getRecentRecipients(owner).filter((item) => item.address.toLowerCase() !== address.toLowerCase());
  const next = [{ owner, address, lastSentAt: Date.now() }, ...current].slice(0, 5);
  window.localStorage.setItem(recipientsKey(owner), JSON.stringify(next));
}

export function getInstantSendActivity(owner?: `0x${string}`): InstantSendActivity[] {
  if (!owner) return [];
  return readJson<InstantSendActivity[]>(activityKey(owner), []);
}

export function saveInstantSendActivity(activity: InstantSendActivity) {
  const current = getInstantSendActivity(activity.owner);
  const next = [activity, ...current.filter((item) => item.hash !== activity.hash)].slice(0, 20);
  window.localStorage.setItem(activityKey(activity.owner), JSON.stringify(next));
}
