# Accrue

Programmable USDC flows for continuous work and instant payments on Circle Arc.

Live demo: https://accrue-web1.vercel.app

Accrue gives senders two ways to move USDC on Arc: stream it gradually over time for ongoing work, allowances, donations, or support, or send it instantly as a one-off transfer. Both flows include an AI step before anything is signed: AI can draft a streaming plan from a plain-language goal, or review an instant transfer for simple risk signals.

## What's Built

### Streams

A sender deposits USDC into a smart contract and streams value to one receiver over time. The contract accrues balances from timestamps; actual USDC transfers happen only on claim, cancellation, or settlement. Senders can describe a goal in plain language, such as "Pay my tutor 50 USDC over ten days", and the AI-assisted planner drafts a rate, schedule, and budget for review before creation.

### Instant Send

A direct, one-time USDC transfer to any wallet on Arc Testnet. There is no stream contract and no schedule. Before the sender signs, an AI confirmation step summarizes the transfer in plain language and flags simple risk signals such as first-time recipient or large share of wallet balance.

The AI call runs through OpenRouter server-side and never blocks the send flow. If the AI API is unavailable, Accrue falls back to a local summary so the user can still review and sign.

Route: `/send`

Live: https://accrue-web1.vercel.app/send

## Official Arc Configuration

Confirmed from official Arc and Circle documentation on 2026-08-04:

- Arc Testnet chain ID: `5042002`
- RPC URL: `https://rpc.testnet.arc.io`
- Explorer: `https://testnet.arcscan.app`
- Arc testnet USDC ERC-20/precompile: `0x3600000000000000000000000000000000000000`
- Faucet: `https://faucet.circle.com`
- Native gas token: USDC
- Native currency decimals: 18 for gas accounting, 6 for the ERC-20 USDC interface

Sources:

- https://docs.arc.io/arc/references/connect-to-arc
- https://docs.arc.io/arc/references/rpc-endpoints
- https://docs.arc.io/arc/references/contract-addresses
- https://developers.circle.com/stablecoins/usdc-contract-addresses

## Architecture

- `contracts/src/AccrueStream.sol`: one-to-one USDC streaming contract.
- `contracts/src/MockUSDC.sol`: 6-decimal local USDC for tests and Anvil.
- `contracts/test/AccrueStream.t.sol`: Foundry tests for create, claim, pause, resume, cancel, refunds, and fuzz accrual caps.
- `contracts/script`: local and Arc deployment scripts.
- `app/send`, `components/InstantSend`: Instant Send flow, transfer form, wallet-balance checks, and AI confirmation modal.
- `app/api/ai/send-confirmation`: server-side route that calls OpenRouter for the transfer summary and risk flag, with local fallback on any failure.
- `app`, `components`, `hooks`, `lib`: Next.js App Router frontend with wagmi, viem, RainbowKit, bigint USDC math, and stream/send actions.

## Accrual Formula

```text
accrued = active elapsed time * rate per second
claimable = min(accrued, deposited amount) - claimed amount
```

Paused time does not accrue. A stream cannot accrue beyond its funded balance. The contract is the financial source of truth.

## Instant Send Flow

```text
1. Sender enters recipient address, amount, and optional memo.
2. Memo is UI-only and is not written on-chain.
3. AI confirmation returns a plain-language summary and risk flag:
   none / first_time_address / large_amount.
4. If the API fails, a local fallback summary is used instead.
5. Sender explicitly confirms.
6. A standard ERC-20 transfer is signed in-wallet.
7. On success, balance refetches, recent recipients and local activity update,
   and an ArcScan transaction link is shown.
```

Instant Send recipients and activity history are stored client-side per browser. There is no backend database in the current build.

## Install

```bash
npm install
```

Install Foundry if `forge` is not available:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

On Windows, use WSL or the official Foundry Windows installation path.

## Environment

```bash
cp .env.example .env
```

Fill these before running locally or deploying:

```bash
DEPLOYER_PRIVATE_KEY=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_ACCRUE_CONTRACT_ADDRESS=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
```

`OPENROUTER_API_KEY` powers the Instant Send AI confirmation step. Create a key at https://openrouter.ai/keys.

`OPENROUTER_MODEL` is optional. If unset, the app uses its default model slug. Verify the current model slug at https://openrouter.ai/models before production use because OpenRouter model availability can change.

Never commit private keys or API keys.

## Contract Commands

```bash
forge build
forge test -vvv
```

Local deployment:

```bash
anvil
npm run deploy:local
```

Arc testnet deployment:

```bash
set ARC_RPC_URL=https://rpc.testnet.arc.io
set ARC_CHAIN_ID=5042002
set ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
set DEPLOYER_PRIVATE_KEY=0x...
npm run deploy:arc
```

Request Arc testnet USDC from the official Circle faucet: https://faucet.circle.com

## Frontend

```bash
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Current Scope

Built now:

- Wallet connection on Arc testnet.
- Exact USDC approval.
- Create and fund streams.
- Incoming and outgoing stream dashboard.
- Stream details with live local accrual estimate.
- Claim, pause, resume, and cancel actions.
- Instant Send: direct one-time USDC transfer to any Arc wallet.
- AI confirmation before Instant Send through OpenRouter, with local fallback.
- AI-assisted plan drafting from plain-language goals for Streams.
- Landing page explaining both flows, with a testnet faucet link.
- Arc explorer contract and transaction links.
- Empty, loading, success, and error states across both flows.
- Foundry contract suite and deployment scripts.

Not implemented yet:

- Usage-based streams.
- AI agent streams.
- Broadcast streams.
- Recurring or subscription sends.
- Governance.
- Full on-chain activity indexing.
- Gas sponsorship.

## Known Limitations

- Stream names and descriptions are mostly local metadata because balances must remain contract-sourced.
- Instant Send activity and recent recipients are stored per-browser with `localStorage`; clearing browser storage clears this local history, though funds and on-chain transactions are unaffected.
- Contract verification depends on the explorer tooling exposed by ArcScan.
- Arc deployment requires a funded deployer private key and testnet USDC.
- The AI confirmation step is advisory only. It does not block or gate a transfer; it informs the sender before signing.

## Links

- Live app: https://accrue-web1.vercel.app
- Instant Send: https://accrue-web1.vercel.app/send
- Repository: https://github.com/Richardweb1/Accrue
