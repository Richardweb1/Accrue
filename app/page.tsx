import Link from "next/link";
import { ArrowRight, Clock, Gauge, PauseCircle, ShieldCheck } from "lucide-react";
import { PlannerBox } from "@/components/planner-box";
import { TemplateCards } from "@/components/template-cards";

export default function Home() {
  return (
    <main className="brand-shell">
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="float-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe7f1] bg-white/70 px-3 py-2 text-sm font-black uppercase text-[#126b7c] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#45d8c5]" />
            Arc-native USDC plans
          </div>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-[#061d3a] sm:text-6xl">Describe the goal. Accrue programs the flow.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#445975]">A warm, AI-assisted way to create programmable USDC payment Plans for family support, everyday work, savings goals, allowances, and creator support on Arc.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#planner" className="btn btn-primary">Plan a Payment <ArrowRight className="h-4 w-4" /></a>
            <Link href="/streams/create" className="btn btn-secondary">Create Manually</Link>
          </div>
        </div>
        <div className="hero-card panel soft-pulse p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white/70">Live Plan preview</p>
              <div className="circle-mark h-10 w-10" aria-hidden="true" />
            </div>
            <div className="mt-8 rounded-lg border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Claimable balance</p>
              <div className="mt-2 text-5xl font-black text-[#9af7ee]">12.4821 USDC</div>
              <p className="mt-4 text-sm text-white/72">Value accrues continuously and settles when claimed.</p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-[#45d8c5] via-[#8ee9ef] to-[#9a8cff]" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-white/10 p-3"><p className="text-white/55">Network</p><p className="font-black">Arc</p></div>
              <div className="rounded-lg bg-white/10 p-3"><p className="text-white/55">Asset</p><p className="font-black">USDC</p></div>
              <div className="rounded-lg bg-white/10 p-3"><p className="text-white/55">Control</p><p className="font-black">Pause</p></div>
            </div>
          </div>
        </div>
      </section>
      <section id="planner" className="mx-auto max-w-6xl px-4 pb-14">
        <PlannerBox />
        <TemplateCards />
      </section>
      <section className="border-y border-[#cfe7f1] bg-white/45 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-4">
          {[
            ["How Accrue works", "USDC is deposited once, then earnings accrue by timestamp math."],
            ["Real-time earnings", "Receivers see a smooth local estimate without constant RPC calls."],
            ["Programmable limits", "Set rate, start time, optional end time, and maximum budget."],
            ["Instant control", "Pause, resume, add funds, claim, or cancel from the stream page."]
          ].map(([title, copy]) => (
            <div className="panel p-5" key={title}>
              <ShieldCheck className="h-5 w-5 text-[#38cfc0]" />
              <h3 className="mt-4 font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#66736d]">{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-black text-[#061d3a]">Built on Arc. Powered by USDC.</h2>
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
  return <div className="panel p-5 text-sm text-[#5f6f89]"><div className="text-[#38cfc0] [&_svg]:h-5 [&_svg]:w-5">{icon}</div><h3 className="mt-4 text-base font-black text-[#061d3a]">{title}</h3><p className="mt-2 leading-6">{copy}</p></div>;
}
