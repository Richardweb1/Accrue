// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {AccrueStream} from "../src/AccrueStream.sol";

contract DeployArc is Script {
    function run() external returns (AccrueStream accrue) {
        address usdc = vm.envAddress("ARC_USDC_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        accrue = new AccrueStream(usdc);
        vm.stopBroadcast();
    }
}
