# Accrue

Programmable USDC flows for continuous work on Circle Arc.

Live demo: https://accrue-web1.vercel.app

Accrue lets a sender deposit USDC into a smart contract and stream value to one receiver over time. The contract accrues balances from timestamps. The frontend shows a live estimate, and actual USDC transfers happen only on claim, cancellation, or settlement actions.

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
- `app`, `components`, `hooks`, `lib`: Next.js App Router frontend with wagmi, viem, RainbowKit, bigint USDC math, and stream actions.

## Accrual Formula

```text
accrued = active elapsed time * rate per second
claimable = min(accrued, deposited amount) - claimed amount
```

Paused time does not accrue. A stream cannot accrue beyond its funded balance. The contract is the financial source of truth.

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

Fill these before Arc testnet deployment:

```bash
DEPLOYER_PRIVATE_KEY=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_ACCRUE_CONTRACT_ADDRESS=
OPENROUTER_API_KEY=
```

Never commit private keys.

`OPENROUTER_API_KEY` powers the server-side Instant Send AI confirmation route. Create it at https://openrouter.ai/keys and set `OPENROUTER_MODEL` only if you want to override the default model slug.

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

## Phase 1 Scope

Built now:

- Wallet connection on Arc testnet.
- Exact USDC approval.
- Create and fund stream.
- Incoming and outgoing stream dashboard.
- Stream details with live local accrual estimate.
- Claim, pause, resume, and cancel actions.
- Arc explorer contract link.
- Empty, loading, success, and error states.
- Foundry contract suite and deployment scripts.

Not implemented in Phase 1:

- Usage-based streams.
- AI agent streams.
- Broadcast streams.
- Subscriptions.
- Governance.
- Indexing database.
- Gas sponsorship.

## Known MVP Limitations

- Activity page has an empty state; full log indexing can be added after deployment.
- Stream names/descriptions are not persisted because balances must remain contract-sourced.
- Contract verification depends on the explorer tooling exposed by ArcScan.
- Arc deployment requires a funded deployer private key and testnet USDC.
