#!/usr/bin/env bash
set -euo pipefail

set -a
source .env
set +a

"$HOME/.foundry/bin/forge" script contracts/script/DeployArc.s.sol \
  --rpc-url "$ARC_RPC_URL" \
  --chain-id "$ARC_CHAIN_ID" \
  --broadcast \
  -vvv
