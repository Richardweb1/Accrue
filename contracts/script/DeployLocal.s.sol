// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {AccrueStream} from "../src/AccrueStream.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract DeployLocal is Script {
    function run() external returns (MockUSDC usdc, AccrueStream accrue) {
        vm.startBroadcast();
        usdc = new MockUSDC();
        accrue = new AccrueStream(address(usdc));
        vm.stopBroadcast();
    }
}
