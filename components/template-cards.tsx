"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, HeartHandshake } from "lucide-react";
import { planTemplates } from "@/lib/plans/templates";
import { templateDefinitions } from "@/lib/plans/guided-templates";

export function TemplateCards() {
  const router = useRouter();

  function openTemplate(template: (typeof planTemplates)[number]) {
    const guided = templateDefinitions.find((definition) => definition.planType === template.id);
    router.push(`/plans/new/${guided?.id || "custom"}`);
  }

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {planTemplates.slice(0, 6).map((template) => (
        <button className="panel group p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-[#45d8c5]" key={`${template.title}-${template.id}`} onClick={() => openTemplate(template)}>
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-[#e9fbff] p-2 text-[#126b7c]"><HeartHandshake className="h-5 w-5" /></span>
            <ArrowUpRight className="h-4 w-4 text-[#7a8cff] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <h3 className="mt-4 font-black text-[#061d3a]">{template.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#5f6f89]">{template.description}</p>
          <p className="mt-4 rounded-lg border border-[#d8eef6] bg-white/64 p-3 text-sm text-[#445975]">{template.prompt}</p>
        </button>
      ))}
    </div>
  );
}
