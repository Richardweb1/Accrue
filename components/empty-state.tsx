import { CircleDollarSign } from "lucide-react";

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="panel flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <CircleDollarSign className="mb-4 h-9 w-9 text-[#107c5c]" />
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[#66736d]">{copy}</p>
    </div>
  );
}
