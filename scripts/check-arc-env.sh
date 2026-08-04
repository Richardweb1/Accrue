#!/usr/bin/env bash
set -euo pipefail

set -a
source .env
set +a

addr="$("$HOME/.foundry/bin/cast" wallet address --private-key "$DEPLOYER_PRIVATE_KEY")"
balance="$("$HOME/.foundry/bin/cast" balance --rpc-url "$ARC_RPC_URL" "$addr")"

echo "DEPLOYER_ADDRESS=$addr"
echo "NATIVE_BALANCE_WEI=$balance"
