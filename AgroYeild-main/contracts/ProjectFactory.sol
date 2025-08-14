// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ProjectFactory
 * @dev Manages the creation and verification of farming projects
 */
contract ProjectFactory is AccessControl {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    
    // Project status enum
    enum ProjectStatus { Pending, Approved, Rejected, Active, Completed, Defaulted }
    
    // Project structure
    struct Project {
        uint256 id;
        address farmer;
        string title;
        string description;
        string ipfsHash; // IPFS CID for project documents
        uint256 targetAmount; // in wei
        uint256 fundedAmount;
        uint256 startDate;
        uint256 endDate;
        ProjectStatus status;
        bool isVerified;
    }
    
    // State variables
    Counters.Counter private _projectIds;
    mapping(uint256 => Project) public projects;
    mapping(address => uint256[]) public farmerProjects;
    
    // Events
    event ProjectCreated(uint256 indexed projectId, address indexed farmer, string ipfsHash);
    event ProjectVerified(uint256 indexed projectId, address indexed validator, bool isApproved);
    event ProjectFunded(uint256 indexed projectId, uint256 amount);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new farming project
     * @param title Project title
     * @param description Project description
     * @param ipfsHash IPFS hash containing project documents
     * @param targetAmount Funding target amount in wei
     * @param durationInDays Project duration in days
     */
    function createProject(
        string memory title,
        string memory description,
        string memory ipfsHash,
        uint256 targetAmount,
        uint256 durationInDays
    ) external onlyRole(FARMER_ROLE) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(targetAmount > 0, "Target amount must be greater than 0");
        require(durationInDays > 0, "Duration must be greater than 0");
        
        _projectIds.increment();
        uint256 projectId = _projectIds.current();
        
        projects[projectId] = Project({
            id: projectId,
            farmer: msg.sender,
            title: title,
            description: description,
            ipfsHash: ipfsHash,
            targetAmount: targetAmount,
            fundedAmount: 0,
            startDate: 0, // Will be set when project is approved
            endDate: 0,   // Will be set when project is approved
            status: ProjectStatus.Pending,
            isVerified: false
        });
        
        farmerProjects[msg.sender].push(projectId);
        
        emit ProjectCreated(projectId, msg.sender, ipfsHash);
    }
    
    /**
     * @dev Verify a project (only callable by validators)
     * @param projectId ID of the project to verify
     * @param isApproved Whether the project is approved
     */
    function verifyProject(uint256 projectId, bool isApproved) external onlyRole(VALIDATOR_ROLE) {
        Project storage project = projects[projectId];
        require(project.id != 0, "Project does not exist");
        require(project.status == ProjectStatus.Pending, "Project already processed");
        
        if (isApproved) {
            project.status = ProjectStatus.Approved;
            project.isVerified = true;
            project.startDate = block.timestamp;
            project.endDate = block.timestamp + 90 days; // Default 90-day project duration
        } else {
            project.status = ProjectStatus.Rejected;
        }
        
        emit ProjectVerified(projectId, msg.sender, isApproved);
    }
    
    /**
     * @dev Get projects by farmer address
     * @param farmer Address of the farmer
     * @return Array of project IDs
     */
    function getProjectsByFarmer(address farmer) external view returns (uint256[] memory) {
        return farmerProjects[farmer];
    }
    
    /**
     * @dev Get project details by ID
     * @param projectId ID of the project
     * @return project The project details
     */
    function getProject(uint256 projectId) external view returns (Project memory) {
        require(projects[projectId].id != 0, "Project does not exist");
        return projects[projectId];
    }
    
    // Additional helper functions can be added here
    
    // The contract will be extended with more functionality in future iterations
}
