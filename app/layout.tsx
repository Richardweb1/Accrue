import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";
import { WalletButton } from "@/components/wallet-button";

export const metadata: Metadata = {
  title: "Accrue",
  description: "Programmable USDC flows for continuous work on Arc."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-black tracking-normal">Accrue</Link>
            <nav className="hidden items-center gap-5 text-sm font-semibold text-[#506058] sm:flex">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/streams">Streams</Link>
              <Link href="/activity">Activity</Link>
            </nav>
            <WalletButton />
          </header>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
