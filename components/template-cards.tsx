"use client";

import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
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
        <button className="panel p-5 text-left" key={`${template.title}-${template.id}`} onClick={() => openTemplate(template)}>
          <HeartHandshake className="h-5 w-5 text-[#107c5c]" />
          <h3 className="mt-4 font-black">{template.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#66736d]">{template.description}</p>
          <p className="mt-4 rounded-lg bg-[#f3f7f4] p-3 text-sm text-[#506058]">{template.prompt}</p>
        </button>
      ))}
    </div>
  );
}
