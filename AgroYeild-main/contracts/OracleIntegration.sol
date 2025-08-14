// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ProjectFactory.sol";

/**
 * @title OracleIntegration
 * @dev Handles verification of project milestones and data from multiple sources
 */
contract OracleIntegration is AccessControl {
    // Role definitions
    bytes32 public constant ORACLE_NODE = keccak256("ORACLE_NODE");
    bytes32 public constant NGO_AGENT = keccak256("NGO_AGENT");
    
    // Data source types
    enum DataSource { NGO, IOT, SATELLITE, CHAINLINK }
    
    // Verification status
    enum VerificationStatus { Pending, Verified, Rejected, Disputed }
    
    // Milestone structure
    struct Milestone {
        uint256 projectId;
        uint256 milestoneId;
        string description;
        uint256 targetDate;
        uint256 completionDate;
        VerificationStatus status;
        string ipfsHash; // For supporting documents
        address verifiedBy;
        DataSource source;
    }
    
    // State variables
    ProjectFactory public projectFactory;
    uint256 public verificationThreshold = 2; // Number of verifications required
    mapping(uint256 => Milestone[]) public projectMilestones; // projectId => Milestone[]
    mapping(bytes32 => address[]) public milestoneVerifiers; // milestoneHash => verifierAddresses[]
    
    // Events
    event MilestoneAdded(uint256 indexed projectId, uint256 milestoneId, string description);
    event MilestoneVerified(uint256 indexed projectId, uint256 milestoneId, address verifier, DataSource source);
    event MilestoneStatusUpdated(uint256 indexed projectId, uint256 milestoneId, VerificationStatus status);
    event DisputeRaised(uint256 indexed projectId, uint256 milestoneId, address raisedBy);
    
    constructor(address _projectFactoryAddress) {
        require(_projectFactoryAddress != address(0), "Invalid project factory address");
        projectFactory = ProjectFactory(_projectFactoryAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Add a new milestone to a project (only callable by project owner or admin)
     */
    function addMilestone(
        uint256 projectId,
        string memory description,
        uint256 targetDate,
        string memory ipfsHash
    ) external {
        // Verify sender is project owner or admin
        (bool success, bytes memory data) = address(projectFactory).staticcall(
            abi.encodeWithSignature("getProject(uint256)", projectId)
        );
        require(success, "Failed to fetch project details");
        
        ProjectFactory.Project memory project = abi.decode(data, (ProjectFactory.Project));
        require(
            project.farmer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to add milestone"
        );
        
        uint256 milestoneId = projectMilestones[projectId].length;
        
        projectMilestones[projectId].push(Milestone({
            projectId: projectId,
            milestoneId: milestoneId,
            description: description,
            targetDate: targetDate,
            completionDate: 0,
            status: VerificationStatus.Pending,
            ipfsHash: ipfsHash,
            verifiedBy: address(0),
            source: DataSource.NGO // Default source
        }));
        
        emit MilestoneAdded(projectId, milestoneId, description);
    }
    
    /**
     * @dev Verify a milestone (callable by oracle nodes or NGO agents)
     */
    function verifyMilestone(
        uint256 projectId,
        uint256 milestoneId,
        bool isVerified,
        DataSource source
    ) external onlyRole(ORACLE_NODE) {
        require(projectId < projectMilestones[projectId].length, "Milestone does not exist");
        Milestone storage milestone = projectMilestones[projectId][milestoneId];
        
        require(
            milestone.status == VerificationStatus.Pending ||
            milestone.status == VerificationStatus.Disputed,
            "Milestone already processed"
        );
        
        // Record verification
        bytes32 milestoneHash = keccak256(abi.encodePacked(projectId, milestoneId));
        milestoneVerifiers[milestoneHash].push(msg.sender);
        
        emit MilestoneVerified(projectId, milestoneId, msg.sender, source);
        
        // Check if enough verifications are received
        if (milestoneVerifiers[milestoneHash].length >= verificationThreshold) {
            milestone.status = isVerified ? 
                VerificationStatus.Verified : 
                VerificationStatus.Rejected;
            milestone.completionDate = block.timestamp;
            milestone.verifiedBy = msg.sender;
            milestone.source = source;
            
            emit MilestoneStatusUpdated(projectId, milestoneId, milestone.status);
        }
    }
    
    /**
     * @dev Raise a dispute for a milestone
     */
    function raiseDispute(uint256 projectId, uint256 milestoneId) external {
        require(projectId < projectMilestones[projectId].length, "Milestone does not exist");
        Milestone storage milestone = projectMilestones[projectId][milestoneId];
        
        require(
            milestone.status == VerificationStatus.Verified ||
            milestone.status == VerificationStatus.Rejected,
            "Cannot dispute pending milestone"
        );
        
        milestone.status = VerificationStatus.Disputed;
        emit DisputeRaised(projectId, milestoneId, msg.sender);
    }
    
    /**
     * @dev Get all milestones for a project
     */
    function getProjectMilestones(uint256 projectId) external view returns (Milestone[] memory) {
        return projectMilestones[projectId];
    }
    
    /**
     * @dev Update verification threshold (admin only)
     */
    function setVerificationThreshold(uint256 _threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_threshold > 0, "Threshold must be greater than 0");
        verificationThreshold = _threshold;
    }
}
