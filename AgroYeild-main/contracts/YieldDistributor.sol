// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./ProjectFactory.sol";
import "./InvestmentManager.sol";

/**
 * @title YieldDistributor
 * @dev Handles profit distribution to investors based on their share in projects
 */
contract YieldDistributor is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant YIELD_MANAGER = keccak256("YIELD_MANAGER");
    
    // Yield distribution structure
    struct Distribution {
        uint256 projectId;
        uint256 totalAmount;
        uint256 timestamp;
        bytes32 merkleRoot;
        string ipfsHash; // For distribution details
    }
    
    // State variables
    ProjectFactory public projectFactory;
    InvestmentManager public investmentManager;
    
    mapping(uint256 => Distribution[]) public projectDistributions; // projectId => Distribution[]
    mapping(bytes32 => bool) public claimed; // merkleRoot => claimed[investor]
    
    // Events
    event DistributionCreated(uint256 indexed projectId, uint256 amount, bytes32 merkleRoot);
    event YieldClaimed(address indexed investor, uint256 indexed projectId, uint256 amount);
    
    constructor(address _projectFactoryAddress, address _investmentManagerAddress) {
        require(_projectFactoryAddress != address(0), "Invalid project factory address");
        require(_investmentManagerAddress != address(0), "Invalid investment manager address");
        
        projectFactory = ProjectFactory(_projectFactoryAddress);
        investmentManager = InvestmentManager(_investmentManagerAddress);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(YIELD_MANAGER, msg.sender);
    }
    
    /**
     * @dev Create a new yield distribution for a project (callable by yield manager)
     */
    function createDistribution(
        uint256 projectId,
        uint256 totalAmount,
        bytes32 merkleRoot,
        string memory ipfsHash
    ) external onlyRole(YIELD_MANAGER) nonReentrant {
        require(totalAmount > 0, "Amount must be greater than 0");
        require(merkleRoot != 0, "Invalid merkle root");
        
        // Verify project exists and is active/completed
        (bool success, bytes memory data) = address(projectFactory).staticcall(
            abi.encodeWithSignature("getProject(uint256)", projectId)
        );
        require(success, "Failed to fetch project details");
        
        ProjectFactory.Project memory project = abi.decode(data, (ProjectFactory.Project));
        require(
            project.status == ProjectFactory.ProjectStatus.Active ||
            project.status == ProjectFactory.ProjectStatus.Completed,
            "Project not eligible for distribution"
        );
        
        // Create new distribution
        projectDistributions[projectId].push(Distribution({
            projectId: projectId,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            merkleRoot: merkleRoot,
            ipfsHash: ipfsHash
        }));
        
        emit DistributionCreated(projectId, totalAmount, merkleRoot);
    }
    
    /**
     * @dev Claim yield for a specific distribution
     */
    function claimYield(
        uint256 projectId,
        uint256 distributionIndex,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external nonReentrant {
        require(distributionIndex < projectDistributions[projectId].length, "Invalid distribution index");
        
        Distribution storage distribution = projectDistributions[projectId][distributionIndex];
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        
        // Verify the merkle proof
        require(
            MerkleProof.verify(merkleProof, distribution.merkleRoot, leaf),
            "Invalid proof"
        );
        
        // Check if already claimed
        bytes32 claimId = keccak256(abi.encodePacked(distribution.merkleRoot, msg.sender));
        require(!claimed[claimId], "Already claimed");
        
        // Mark as claimed and transfer funds
        claimed[claimId] = true;
        
        // Transfer funds to investor (in a real implementation, you'd use safeTransfer)
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to send yield");
        
        emit YieldClaimed(msg.sender, projectId, amount);
    }
    
    /**
     * @dev Get all distributions for a project
     */
    function getProjectDistributions(uint256 projectId) external view returns (Distribution[] memory) {
        return projectDistributions[projectId];
    }
    
    /**
     * @dev Check if a claim has been processed
     */
    function isClaimed(bytes32 merkleRoot, address account) external view returns (bool) {
        bytes32 claimId = keccak256(abi.encodePacked(merkleRoot, account));
        return claimed[claimId];
    }
    
    // Allow contract to receive funds
    receive() external payable {}
}
