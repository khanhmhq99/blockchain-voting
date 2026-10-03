// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract VotingSystem is AccessControl {
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");

    struct Election {
        address organizer;
        uint64 startTime;
        uint64 endTime;
        bool closed;
        uint32 candidateCount;
        bool exists;
    }

    struct Candidate { string metadata; uint256 voteCount; }

    uint256 public electionCount;
    mapping(uint256 => Election) private elections;
    mapping(uint256 => mapping(uint256 => Candidate)) private candidates;
    mapping(uint256 => mapping(address => bool)) public approvedVoter;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ElectionCreated(uint256 indexed electionId, address indexed organizer, uint64 startTime, uint64 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string metadata);
    event VoterApproved(uint256 indexed electionId, address indexed voter);
    // Voter address is intentionally omitted; calldata remains linkable in this MVP.
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId);
    event ElectionClosed(uint256 indexed electionId);

    error ElectionNotFound();
    error NotElectionManager();
    error InvalidTimeWindow();
    error CandidateConfigurationLocked();
    error VotingNotActive();
    error ElectionAlreadyClosed();
    error VoterNotApproved();
    error AlreadyVoted();
    error InvalidCandidate();
    error InvalidVoter();

    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) revert InvalidVoter();
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ORGANIZER_ROLE, initialAdmin);
    }

    modifier existingElection(uint256 electionId) {
        if (!elections[electionId].exists) revert ElectionNotFound();
        _;
    }

    modifier onlyElectionManager(uint256 electionId) {
        Election storage election = elections[electionId];
        if (!election.exists) revert ElectionNotFound();
        if (msg.sender != election.organizer && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert NotElectionManager();
        _;
    }

    function createElection(uint64 startTime, uint64 endTime) external onlyRole(ORGANIZER_ROLE) returns (uint256 electionId) {
        if (startTime >= endTime || endTime <= block.timestamp) revert InvalidTimeWindow();
        electionId = ++electionCount;
        elections[electionId] = Election(msg.sender, startTime, endTime, false, 0, true);
        emit ElectionCreated(electionId, msg.sender, startTime, endTime);
    }

    function addCandidate(uint256 electionId, string calldata metadata) external onlyElectionManager(electionId) returns (uint256 candidateId) {
        Election storage election = elections[electionId];
        if (election.closed || block.timestamp >= election.startTime) revert CandidateConfigurationLocked();
        candidateId = ++election.candidateCount;
        candidates[electionId][candidateId] = Candidate(metadata, 0);
        emit CandidateAdded(electionId, candidateId, metadata);
    }

    function approveVoter(uint256 electionId, address voter) external onlyElectionManager(electionId) {
        Election storage election = elections[electionId];
        if (election.closed || block.timestamp > election.endTime) revert ElectionAlreadyClosed();
        if (voter == address(0)) revert InvalidVoter();
        approvedVoter[electionId][voter] = true;
        emit VoterApproved(electionId, voter);
    }

    function castVote(uint256 electionId, uint256 candidateId) external existingElection(electionId) {
        Election storage election = elections[electionId];
        if (election.closed || block.timestamp < election.startTime || block.timestamp > election.endTime) revert VotingNotActive();
        if (!approvedVoter[electionId][msg.sender]) revert VoterNotApproved();
        if (hasVoted[electionId][msg.sender]) revert AlreadyVoted();
        if (candidateId == 0 || candidateId > election.candidateCount) revert InvalidCandidate();
        hasVoted[electionId][msg.sender] = true;
        candidates[electionId][candidateId].voteCount += 1;
        emit VoteCast(electionId, candidateId);
    }

    function closeElection(uint256 electionId) external onlyElectionManager(electionId) {
        Election storage election = elections[electionId];
        if (election.closed) revert ElectionAlreadyClosed();
        election.closed = true;
        emit ElectionClosed(electionId);
    }

    function getElection(uint256 electionId) external view existingElection(electionId) returns (Election memory) { return elections[electionId]; }
    function getCandidate(uint256 electionId, uint256 candidateId) public view existingElection(electionId) returns (Candidate memory) {
        if (candidateId == 0 || candidateId > elections[electionId].candidateCount) revert InvalidCandidate();
        return candidates[electionId][candidateId];
    }
    function getCandidates(uint256 electionId) external view existingElection(electionId) returns (Candidate[] memory result) {
        uint256 count = elections[electionId].candidateCount;
        result = new Candidate[](count);
        for (uint256 i = 0; i < count; i++) result[i] = candidates[electionId][i + 1];
    }
    function getResults(uint256 electionId) external view existingElection(electionId) returns (uint256[] memory result) {
        uint256 count = elections[electionId].candidateCount;
        result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) result[i] = candidates[electionId][i + 1].voteCount;
    }
    function isApprovedVoter(uint256 electionId, address voter) external view returns (bool) { return approvedVoter[electionId][voter]; }
}
