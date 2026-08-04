// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AccrueStream is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error InvalidReceiver();
    error InvalidAmount();
    error InvalidRate();
    error InvalidSchedule();
    error Unauthorized();
    error StreamNotFound();
    error StreamPausedError();
    error StreamNotPaused();
    error StreamCancelledError();
    error NothingToClaim();
    error InsufficientStreamBalance();
    error TransferFailed();

    struct Stream {
        address sender;
        address receiver;
        uint128 depositedAmount;
        uint128 claimedAmount;
        uint96 ratePerSecond;
        uint40 startTime;
        uint40 endTime;
        uint40 lastStateChange;
        uint40 totalPausedDuration;
        uint40 pausedAt;
        bool paused;
        bool cancelled;
    }

    IERC20 public immutable usdc;
    uint256 public nextStreamId = 1;

    mapping(uint256 => Stream) private streams;
    mapping(address => uint256[]) private senderStreams;
    mapping(address => uint256[]) private receiverStreams;

    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed receiver, uint256 depositedAmount, uint256 ratePerSecond, uint256 startTime, uint256 endTime);
    event StreamFunded(uint256 indexed streamId, address indexed sender, uint256 amount);
    event StreamPaused(uint256 indexed streamId, address indexed sender);
    event StreamResumed(uint256 indexed streamId, address indexed sender);
    event StreamClaimed(uint256 indexed streamId, address indexed receiver, uint256 amount);
    event StreamCancelled(uint256 indexed streamId, address indexed sender, address indexed receiver, uint256 claimedAmount, uint256 refundedAmount);
    event StreamCompleted(uint256 indexed streamId, address indexed sender, address indexed receiver);

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert InvalidReceiver();
        usdc = IERC20(usdc_);
    }

    function createStream(address receiver, uint256 depositAmount, uint256 ratePerSecond, uint256 startTime, uint256 endTime) external nonReentrant returns (uint256 streamId) {
        if (receiver == address(0) || receiver == msg.sender) revert InvalidReceiver();
        if (depositAmount == 0 || depositAmount > type(uint128).max) revert InvalidAmount();
        if (ratePerSecond == 0 || ratePerSecond > type(uint96).max) revert InvalidRate();
        if (startTime < block.timestamp || startTime > type(uint40).max || endTime > type(uint40).max) revert InvalidSchedule();
        if (endTime != 0 && endTime <= startTime) revert InvalidSchedule();

        streamId = nextStreamId++;
        streams[streamId] = Stream({
            sender: msg.sender,
            receiver: receiver,
            depositedAmount: uint128(depositAmount),
            claimedAmount: 0,
            ratePerSecond: uint96(ratePerSecond),
            startTime: uint40(startTime),
            endTime: uint40(endTime),
            lastStateChange: uint40(block.timestamp),
            totalPausedDuration: 0,
            pausedAt: 0,
            paused: false,
            cancelled: false
        });
        senderStreams[msg.sender].push(streamId);
        receiverStreams[receiver].push(streamId);
        usdc.safeTransferFrom(msg.sender, address(this), depositAmount);
        emit StreamCreated(streamId, msg.sender, receiver, depositAmount, ratePerSecond, startTime, endTime);
    }

    function claim(uint256 streamId) public nonReentrant {
        Stream storage stream = _stream(streamId);
        if (msg.sender != stream.receiver) revert Unauthorized();
        _claim(streamId, stream);
    }

    function claimAll(uint256[] calldata streamIds) external {
        for (uint256 i; i < streamIds.length; i++) {
            Stream storage stream = _stream(streamIds[i]);
            if (msg.sender != stream.receiver) revert Unauthorized();
            uint256 amount = _claimable(stream);
            if (amount != 0) {
                stream.claimedAmount += uint128(amount);
                usdc.safeTransfer(stream.receiver, amount);
                emit StreamClaimed(streamIds[i], stream.receiver, amount);
                if (_isComplete(stream)) emit StreamCompleted(streamIds[i], stream.sender, stream.receiver);
            }
        }
    }

    function pauseStream(uint256 streamId) external {
        Stream storage stream = _stream(streamId);
        if (msg.sender != stream.sender) revert Unauthorized();
        if (stream.cancelled) revert StreamCancelledError();
        if (stream.paused) revert StreamPausedError();
        stream.paused = true;
        stream.pausedAt = uint40(block.timestamp);
        emit StreamPaused(streamId, msg.sender);
    }

    function resumeStream(uint256 streamId) external {
        Stream storage stream = _stream(streamId);
        if (msg.sender != stream.sender) revert Unauthorized();
        if (stream.cancelled) revert StreamCancelledError();
        if (!stream.paused) revert StreamNotPaused();
        stream.totalPausedDuration += uint40(block.timestamp) - stream.pausedAt;
        stream.paused = false;
        stream.pausedAt = 0;
        stream.lastStateChange = uint40(block.timestamp);
        emit StreamResumed(streamId, msg.sender);
    }

    function addFunds(uint256 streamId, uint256 amount) external nonReentrant {
        Stream storage stream = _stream(streamId);
        if (msg.sender != stream.sender) revert Unauthorized();
        if (stream.cancelled) revert StreamCancelledError();
        if (amount == 0 || stream.depositedAmount + amount > type(uint128).max) revert InvalidAmount();
        stream.depositedAmount += uint128(amount);
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit StreamFunded(streamId, msg.sender, amount);
    }

    function cancelStream(uint256 streamId) external nonReentrant {
        Stream storage stream = _stream(streamId);
        if (msg.sender != stream.sender) revert Unauthorized();
        if (stream.cancelled) revert StreamCancelledError();
        uint256 claimableAmount = _claimable(stream);
        uint256 refundableAmount = _refundable(stream);
        stream.cancelled = true;
        stream.paused = false;
        stream.pausedAt = 0;
        if (claimableAmount != 0) {
            stream.claimedAmount += uint128(claimableAmount);
            usdc.safeTransfer(stream.receiver, claimableAmount);
        }
        if (refundableAmount != 0) usdc.safeTransfer(stream.sender, refundableAmount);
        emit StreamCancelled(streamId, stream.sender, stream.receiver, claimableAmount, refundableAmount);
    }

    function getStream(uint256 streamId) external view returns (Stream memory) {
        return _stream(streamId);
    }

    function getAccruedAmount(uint256 streamId) external view returns (uint256) {
        return _accrued(_stream(streamId));
    }

    function getClaimableAmount(uint256 streamId) external view returns (uint256) {
        return _claimable(_stream(streamId));
    }

    function getRefundableAmount(uint256 streamId) external view returns (uint256) {
        return _refundable(_stream(streamId));
    }

    function getSenderStreams(address sender) external view returns (uint256[] memory) {
        return senderStreams[sender];
    }

    function getReceiverStreams(address receiver) external view returns (uint256[] memory) {
        return receiverStreams[receiver];
    }

    function _claim(uint256 streamId, Stream storage stream) private {
        uint256 amount = _claimable(stream);
        if (amount == 0) revert NothingToClaim();
        stream.claimedAmount += uint128(amount);
        usdc.safeTransfer(stream.receiver, amount);
        emit StreamClaimed(streamId, stream.receiver, amount);
        if (_isComplete(stream)) emit StreamCompleted(streamId, stream.sender, stream.receiver);
    }

    function _stream(uint256 streamId) private view returns (Stream storage stream) {
        stream = streams[streamId];
        if (stream.sender == address(0)) revert StreamNotFound();
    }

    function _claimable(Stream storage stream) private view returns (uint256) {
        uint256 accrued = _accrued(stream);
        if (accrued <= stream.claimedAmount) return 0;
        return accrued - stream.claimedAmount;
    }

    function _refundable(Stream storage stream) private view returns (uint256) {
        uint256 accrued = _accrued(stream);
        if (stream.depositedAmount <= accrued) return 0;
        return stream.depositedAmount - accrued;
    }

    function _accrued(Stream storage stream) private view returns (uint256) {
        if (stream.cancelled || block.timestamp <= stream.startTime) return 0;
        uint256 until = block.timestamp;
        if (stream.paused) until = stream.pausedAt;
        if (stream.endTime != 0 && until > stream.endTime) until = stream.endTime;
        if (until <= stream.startTime) return 0;
        uint256 paused = stream.totalPausedDuration;
        uint256 elapsed = until - stream.startTime;
        if (paused >= elapsed) return 0;
        uint256 accrued = (elapsed - paused) * uint256(stream.ratePerSecond);
        return accrued > stream.depositedAmount ? stream.depositedAmount : accrued;
    }

    function _isComplete(Stream storage stream) private view returns (bool) {
        return stream.claimedAmount == stream.depositedAmount || (stream.endTime != 0 && block.timestamp >= stream.endTime && _claimable(stream) == 0);
    }
}
