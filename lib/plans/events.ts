import { decodeEventLog, type TransactionReceipt } from "viem";
import { accrueAbi } from "@/lib/abi";

export function extractStreamIdFromReceipt(receipt: TransactionReceipt): bigint {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: accrueAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === "StreamCreated") {
        return decoded.args.streamId;
      }
    } catch {
      // Ignore unrelated logs.
    }
  }
  throw new Error("StreamCreated event was not found in the transaction receipt.");
}
