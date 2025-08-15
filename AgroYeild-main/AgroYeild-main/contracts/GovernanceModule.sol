// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title GovernanceModule
 * @dev Handles DAO governance with proposal creation and voting
 */
contract GovernanceModule is AccessControl {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    
    // Role definitions
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");
    
    // Proposal status
    enum ProposalStatus { Pending, Active, Succeeded, Executed, Defeated }
    
    // Vote type
    enum VoteType { Against, For, Abstain }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        string ipfsHash; // For detailed proposal data
    }
    
    // State variables
    Counters.Counter private _proposalIds;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower; // In a real implementation, this would be based on token balance
    mapping(address => mapping(uint256 => bool)) public hasVoted;
    
    // Parameters
    uint256 public votingDelay = 1; // blocks
    uint256 public votingPeriod = 1000; // blocks (~1 day at 15s/block)
    uint256 public proposalThreshold = 1; // Minimum voting power needed to create a proposal
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startBlock,
        uint256 endBlock,
        string ipfsHash
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType support,
        uint256 votes
    );
    event ProposalExecuted(uint256 indexed proposalId);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new governance proposal
     */
    function propose(
        string memory description,
        string memory ipfsHash
    ) external onlyRole(GOVERNOR_ROLE) returns (uint256) {
        require(
            votingPower[msg.sender] >= proposalThreshold,
            "Insufficient voting power"
        );
        
        _proposalIds.increment();
        uint256 proposalId = _proposalIds.current();
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.startBlock = block.number.add(votingDelay);
        newProposal.endBlock = block.number.add(votingPeriod);
        newProposal.ipfsHash = ipfsHash;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            newProposal.startBlock,
            newProposal.endBlock,
            ipfsHash
        );
        
        return proposalId;
    }
    
    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(
        uint256 proposalId,
        VoteType support
    ) external {
        require(votingPower[msg.sender] > 0, "No voting power");
        require(!hasVoted[msg.sender][proposalId], "Already voted");
        
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(
            block.number >= proposal.startBlock &&
            block.number <= proposal.endBlock,
            "Voting period not active"
        );
        
        uint256 votes = votingPower[msg.sender];
        
        if (support == VoteType.For) {
            proposal.forVotes = proposal.forVotes.add(votes);
        } else if (support == VoteType.Against) {
            proposal.againstVotes = proposal.againstVotes.add(votes);
        } else if (support == VoteType.Abstain) {
            proposal.abstainVotes = proposal.abstainVotes.add(votes);
        }
        
        hasVoted[msg.sender][proposalId] = true;
        
        emit VoteCast(msg.sender, proposalId, support, votes);
    }
    
    /**
     * @dev Execute a successful proposal
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(block.number > proposal.endBlock, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        
        // Check if proposal passed
        bool passed = proposal.forVotes > proposal.againstVotes;
        require(passed, "Proposal did not pass");
        
        proposal.executed = true;
        
        // In a real implementation, you would execute the proposal's actions here
        // For example: call other contracts, update parameters, etc.
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Get the current state of a proposal
     */
    function state(uint256 proposalId) external view returns (ProposalStatus) {
        require(_proposalIds.current() >= proposalId, "Proposal does not exist");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.executed) {
            return ProposalStatus.Executed;
        } else if (block.number <= proposal.startBlock) {
            return ProposalStatus.Pending;
        } else if (block.number <= proposal.endBlock) {
            return ProposalStatus.Active;
        } else if (proposal.forVotes <= proposal.againstVotes) {
            return ProposalStatus.Defeated;
        } else {
            return ProposalStatus.Succeeded;
        }
    }
    
    /**
     * @dev Set voting parameters (only callable by admin)
     */
    function setVotingParameters(
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
    }
    
    /**
     * @dev Grant voting power to an address (only callable by admin)
     */
    function setVotingPower(
        address account,
        uint256 power
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        votingPower[account] = power;
    }
}
