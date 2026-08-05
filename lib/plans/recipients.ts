import { isAddress } from "viem";

export type SavedRecipient = {
  id: string;
  owner: `0x${string}`;
  displayName: string;
  address: `0x${string}`;
  label?: string;
  createdAt: number;
};

export function recipientsKey(owner?: string) {
  return `accrue:recipients:${owner?.toLowerCase() || "anonymous"}`;
}

export function validateRecipientAddress(address: string, owner?: string): string | undefined {
  if (!isAddress(address)) return "Enter a valid wallet address.";
  if (owner && address.toLowerCase() === owner.toLowerCase()) return "Receiver cannot be your connected wallet.";
  return undefined;
}

export function loadRecipients(owner?: string): SavedRecipient[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(recipientsKey(owner)) || "[]") as SavedRecipient[];
  } catch {
    return [];
  }
}

export function saveRecipients(owner: string | undefined, recipients: SavedRecipient[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(recipientsKey(owner), JSON.stringify(recipients));
}

export function upsertRecipient(owner: `0x${string}`, recipients: SavedRecipient[], input: Omit<SavedRecipient, "id" | "owner" | "createdAt"> & { id?: string }): SavedRecipient[] {
  const next: SavedRecipient = {
    id: input.id || crypto.randomUUID(),
    owner,
    displayName: input.displayName,
    address: input.address,
    label: input.label,
    createdAt: Date.now()
  };
  return [next, ...recipients.filter((recipient) => recipient.id !== next.id)];
}

export function removeRecipient(recipients: SavedRecipient[], id: string) {
  return recipients.filter((recipient) => recipient.id !== id);
}
