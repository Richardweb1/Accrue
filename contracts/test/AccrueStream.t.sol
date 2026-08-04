// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {AccrueStream} from "../src/AccrueStream.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract AccrueStreamTest is Test {
    AccrueStream accrue;
    MockUSDC usdc;

    address sender = address(0xA11CE);
    address receiver = address(0xB0B);
    address stranger = address(0xE0E);

    uint256 constant ONE = 1e6;

    function setUp() public {
        usdc = new MockUSDC();
        accrue = new AccrueStream(address(usdc));
        usdc.mint(sender, 1_000_000 * ONE);
        vm.prank(sender);
        usdc.approve(address(accrue), type(uint256).max);
    }

    function _create(uint256 deposit, uint256 rate, uint256 start, uint256 end) internal returns (uint256) {
        vm.prank(sender);
        return accrue.createStream(receiver, deposit, rate, start, end);
    }

    function testCreateValidStream() public {
        uint256 id = _create(100 * ONE, ONE, block.timestamp, 0);
        AccrueStream.Stream memory stream = accrue.getStream(id);
        assertEq(stream.sender, sender);
        assertEq(stream.receiver, receiver);
        assertEq(stream.depositedAmount, 100 * ONE);
        assertEq(accrue.getSenderStreams(sender).length, 1);
        assertEq(accrue.getReceiverStreams(receiver).length, 1);
    }

    function testRejectZeroReceiver() public {
        vm.prank(sender);
        vm.expectRevert(AccrueStream.InvalidReceiver.selector);
        accrue.createStream(address(0), 100 * ONE, ONE, block.timestamp, 0);
    }

    function testRejectSenderAsReceiver() public {
        vm.prank(sender);
        vm.expectRevert(AccrueStream.InvalidReceiver.selector);
        accrue.createStream(sender, 100 * ONE, ONE, block.timestamp, 0);
    }

    function testRejectZeroDeposit() public {
        vm.prank(sender);
        vm.expectRevert(AccrueStream.InvalidAmount.selector);
        accrue.createStream(receiver, 0, ONE, block.timestamp, 0);
    }

    function testRejectZeroRate() public {
        vm.prank(sender);
        vm.expectRevert(AccrueStream.InvalidRate.selector);
        accrue.createStream(receiver, ONE, 0, block.timestamp, 0);
    }

    function testRejectInvalidDates() public {
        vm.prank(sender);
        vm.expectRevert(AccrueStream.InvalidSchedule.selector);
        accrue.createStream(receiver, ONE, ONE, block.timestamp + 10, block.timestamp + 9);
    }

    function testAccruesAfterTimePasses() public {
        uint256 id = _create(100 * ONE, ONE, block.timestamp, 0);
        vm.warp(block.timestamp + 25);
        assertEq(accrue.getAccruedAmount(id), 25 * ONE);
    }

    function testDoesNotAccrueBeforeStart() public {
        uint256 id = _create(100 * ONE, ONE, block.timestamp + 100, 0);
        vm.warp(block.timestamp + 50);
        assertEq(accrue.getAccruedAmount(id), 0);
    }

    function testStopsAtEndTime() public {
        uint256 start = block.timestamp;
        uint256 id = _create(100 * ONE, ONE, start, start + 10);
        vm.warp(start + 100);
        assertEq(accrue.getAccruedAmount(id), 10 * ONE);
    }

    function testCapsAtDeposit() public {
        uint256 id = _create(5 * ONE, ONE, block.timestamp, 0);
        vm.warp(block.timestamp + 100);
        assertEq(accrue.getAccruedAmount(id), 5 * ONE);
    }

    function testClaimPartialAndAgain() public {
        uint256 id = _create(100 * ONE, ONE, block.timestamp, 0);
        vm.warp(block.timestamp + 10);
        vm.prank(receiver);
        accrue.claim(id);
        assertEq(usdc.balanceOf(receiver), 10 * ONE);
        vm.warp(block.timestamp + 5);
        vm.prank(receiver);
        accrue.claim(id);
        assertEq(usdc.balanceOf(receiver), 15 * ONE);
    }

    function testPreventDoubleClaiming() public {
        uint256 id = _create(100 * ONE, ONE, block.timestamp, 0);
        vm.warp(block.timestamp + 10);
        vm.prank(receiver);
        accrue.claim(id);
        vm.prank(receiver);
        vm.expectRevert(AccrueStream.NothingToClaim.selector);
        accrue.claim(id);
    }

    function testPauseResumeAndNoAccrualWhilePaused() public {
        uint256 id = _create(100 * ONE, ONE, block.timestamp, 0);
        vm.warp(block.timestamp + 10);
        vm.prank(sender);
        accrue.pauseStream(id);
        vm.warp(block.timestamp + 50);
        assertEq(accrue.getAccruedAmount(id), 10 * ONE);
        vm.prank(sender);
        accrue.resumeStream(id);
        vm.warp(block.timestamp + 10);
        assertEq(accrue.getAccruedAmount(id), 20 * ONE);
    }

    function testAddFunds() public {
        uint256 id = _create(10 * ONE, ONE, block.timestamp, 0);
        vm.prank(sender);
        accrue.addFunds(id, 15 * ONE);
        assertEq(accrue.getStream(id).depositedAmount, 25 * ONE);
    }

    function testCancelPaysAccruedAndRefundsUnused() public {
        uint256 id = _create(100 * ONE, ONE, block.timestamp, 0);
        vm.warp(block.timestamp + 30);
        uint256 beforeSender = usdc.balanceOf(sender);
        vm.prank(sender);
        accrue.cancelStream(id);
        assertEq(usdc.balanceOf(receiver), 30 * ONE);
        assertEq(usdc.balanceOf(sender), beforeSender + 70 * ONE);
        assertTrue(accrue.getStream(id).cancelled);
    }

    function testUnauthorizedActionsRevert() public {
        uint256 id = _create(100 * ONE, ONE, block.timestamp, 0);
        vm.prank(stranger);
        vm.expectRevert(AccrueStream.Unauthorized.selector);
        accrue.pauseStream(id);
        vm.prank(sender);
        accrue.pauseStream(id);
        vm.prank(stranger);
        vm.expectRevert(AccrueStream.Unauthorized.selector);
        accrue.resumeStream(id);
        vm.prank(stranger);
        vm.expectRevert(AccrueStream.Unauthorized.selector);
        accrue.cancelStream(id);
        vm.prank(stranger);
        vm.expectRevert(AccrueStream.Unauthorized.selector);
        accrue.claim(id);
    }

    function testClaimAllSkipsEmptyStreams() public {
        uint256 a = _create(100 * ONE, ONE, block.timestamp, 0);
        uint256 b = _create(100 * ONE, ONE, block.timestamp + 100, 0);
        uint256[] memory ids = new uint256[](2);
        ids[0] = a;
        ids[1] = b;
        vm.warp(block.timestamp + 10);
        vm.prank(receiver);
        accrue.claimAll(ids);
        assertEq(usdc.balanceOf(receiver), 10 * ONE);
    }

    function testFuzzAccrualIsCapped(uint96 rate, uint40 elapsed, uint128 deposit) public {
        vm.assume(rate > 0);
        deposit = uint128(bound(deposit, 1, 1_000_000 * ONE));
        uint256 id = _create(deposit, rate, block.timestamp, 0);
        vm.warp(block.timestamp + elapsed);
        assertLe(accrue.getAccruedAmount(id), deposit);
        assertLe(accrue.getClaimableAmount(id), deposit);
    }
}
