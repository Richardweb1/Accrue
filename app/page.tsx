import Link from "next/link";
import { ArrowRight, Clock, Gauge, PauseCircle, ShieldCheck } from "lucide-react";
import { PlannerBox } from "@/components/planner-box";
import { TemplateCards } from "@/components/template-cards";

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase text-[#107c5c]">The AI assistant for programmable everyday payments.</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight sm:text-6xl">Describe the goal. Accrue programs the flow.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#506058]">Create safe, programmable USDC payment Plans for family support, everyday work, savings goals, allowances, and services on Arc.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#planner" className="btn btn-primary">Plan a Payment <ArrowRight className="h-4 w-4" /></a>
            <Link href="/streams/create" className="btn btn-secondary">Create Manually</Link>
          </div>
        </div>
        <div className="panel p-6 shadow-sm">
          <p className="text-sm font-bold text-[#66736d]">Live preview</p>
          <div className="mt-5 rounded-lg border border-[#dfe7e1] bg-[#fbfdfb] p-5">
            <p className="text-sm text-[#66736d]">Claimable balance</p>
            <div className="mt-2 text-5xl font-black text-[#107c5c]">12.4821 USDC</div>
            <p className="mt-4 text-sm text-[#66736d]">Value accrues continuously and settles when claimed.</p>
            <div className="mt-6 h-2 rounded-full bg-[#e7eee9]"><div className="h-2 w-2/3 rounded-full bg-[#107c5c]" /></div>
          </div>
        </div>
      </section>
      <section id="planner" className="mx-auto max-w-6xl px-4 pb-14">
        <PlannerBox />
        <TemplateCards />
      </section>
      <section className="border-y border-[#dfe7e1] bg-white/60 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-4">
          {[
            ["How Accrue works", "USDC is deposited once, then earnings accrue by timestamp math."],
            ["Real-time earnings", "Receivers see a smooth local estimate without constant RPC calls."],
            ["Programmable limits", "Set rate, start time, optional end time, and maximum budget."],
            ["Instant control", "Pause, resume, add funds, claim, or cancel from the stream page."]
          ].map(([title, copy]) => (
            <div className="panel p-5" key={title}>
              <ShieldCheck className="h-5 w-5 text-[#107c5c]" />
              <h3 className="mt-4 font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#66736d]">{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-black">Built on Arc</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Use icon={<Clock />} title="Continuous work" copy="Freelancers, retainers, creator support, grants, moderators, and allowances." />
          <Use icon={<Gauge />} title="Clear limits" copy="The contract never accrues beyond funded balance." />
          <Use icon={<PauseCircle />} title="Sender controls" copy="Paused time does not count toward earnings." />
        </div>
      </section>
    </main>
  );
}

function Use({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="panel p-5 text-sm text-[#66736d]"><div className="text-[#107c5c] [&_svg]:h-5 [&_svg]:w-5">{icon}</div><h3 className="mt-4 text-base font-black text-[#111815]">{title}</h3><p className="mt-2 leading-6">{copy}</p></div>;
}
