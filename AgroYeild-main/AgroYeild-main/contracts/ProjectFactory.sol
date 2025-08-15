// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ProjectFactory
 * @dev Manages farming projects with BDT amounts and USDC funding
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
        uint256 targetAmountBDT; // Target amount in BDT (scaled by 100, so 100000 BDT = 10000000)
        uint256 targetAmountUSDC; // Target amount in USDC (6 decimals)
        uint256 fundedAmountUSDC; // Funded amount in USDC (6 decimals)
        uint256 startDate;
        uint256 endDate;
        ProjectStatus status;
        bool isVerified;
        string location; // Project location
        string category; // Crop type/category
    }
    
    // Constants for BDT/USDC conversion
    uint256 public constant BDT_TO_USDC_RATE = 125; // 1 BDT = 125 USDC (scaled by 1e6)
    uint256 public constant BDT_DECIMALS = 100; // BDT amounts scaled by 100 (2 decimals)
    
    // USDC token interface
    IERC20 public immutable USDC;
    
    // State variables
    Counters.Counter private _projectIds;
    mapping(uint256 => Project) public projects;
    mapping(address => uint256[]) public farmerProjects;
    
    // Events
    event ProjectCreated(
        uint256 indexed projectId, 
        address indexed farmer, 
        string ipfsHash,
        uint256 targetAmountBDT,
        uint256 targetAmountUSDC
    );
    event ProjectVerified(uint256 indexed projectId, address indexed validator, bool isApproved);
    event ProjectFunded(uint256 indexed projectId, uint256 amountUSDC, uint256 totalFundedUSDC);
    
    constructor(address _usdcAddress) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        USDC = IERC20(_usdcAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new farming project with BDT target amount
     * @param title Project title
     * @param description Project description
     * @param ipfsHash IPFS hash containing project documents
     * @param targetAmountBDT Target amount in BDT (scaled by 100, so 100000 BDT = 10000000)
     * @param durationInDays Project duration in days
     * @param location Project location
     * @param category Project category
     */
    function createProject(
        string memory title,
        string memory description,
        string memory ipfsHash,
        uint256 targetAmountBDT,
        uint256 durationInDays,
        string memory location,
        string memory category
    ) external onlyRole(FARMER_ROLE) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(targetAmountBDT > 0, "Target amount must be greater than 0");
        require(durationInDays > 0, "Duration must be greater than 0");
        
        _projectIds.increment();
        uint256 projectId = _projectIds.current();
        
        // Convert BDT to USDC (targetAmountBDT is scaled by 100, USDC has 6 decimals)
        // Formula: (targetAmountBDT / 100) / 125 * 1e6
        uint256 targetAmountUSDC = (targetAmountBDT * 1e6) / (BDT_TO_USDC_RATE * BDT_DECIMALS);
        
        projects[projectId] = Project({
            id: projectId,
            farmer: msg.sender,
            title: title,
            description: description,
            ipfsHash: ipfsHash,
            targetAmountBDT: targetAmountBDT,
            targetAmountUSDC: targetAmountUSDC,
            fundedAmountUSDC: 0,
            startDate: 0, // Will be set when project is approved
            endDate: 0,   // Will be set when project is approved
            status: ProjectStatus.Pending,
            isVerified: false,
            location: location,
            category: category
        });
        
        farmerProjects[msg.sender].push(projectId);
        
        emit ProjectCreated(projectId, msg.sender, ipfsHash, targetAmountBDT, targetAmountUSDC);
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
            project.endDate = block.timestamp + (90 days); // Default 90-day project duration
        } else {
            project.status = ProjectStatus.Rejected;
        }
        
        emit ProjectVerified(projectId, msg.sender, isApproved);
    }
    
    /**
     * @dev Update funded amount (called by InvestmentManager)
     * @param projectId ID of the project
     * @param amountUSDC Amount funded in USDC
     */
    function updateFunding(uint256 projectId, uint256 amountUSDC) external {
        // Only InvestmentManager should call this - we'll add proper access control
        Project storage project = projects[projectId];
        require(project.id != 0, "Project does not exist");
        
        project.fundedAmountUSDC += amountUSDC;
        
        // Check if project is fully funded
        if (project.fundedAmountUSDC >= project.targetAmountUSDC) {
            project.status = ProjectStatus.Active;
        }
        
        emit ProjectFunded(projectId, amountUSDC, project.fundedAmountUSDC);
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
    
    /**
     * @dev Convert BDT amount to USDC
     * @param amountBDT Amount in BDT (scaled by 100)
     * @return Amount in USDC (6 decimals)
     */
    function convertBDTToUSDC(uint256 amountBDT) external pure returns (uint256) {
        return (amountBDT * 1e6) / (BDT_TO_USDC_RATE * BDT_DECIMALS);
    }
    
    /**
     * @dev Convert USDC amount to BDT
     * @param amountUSDC Amount in USDC (6 decimals)
     * @return Amount in BDT (scaled by 100)
     */
    function convertUSDCToBDT(uint256 amountUSDC) external pure returns (uint256) {
        return (amountUSDC * BDT_TO_USDC_RATE * BDT_DECIMALS) / 1e6;
    }
    
    /**
     * @dev Get funding progress as percentage
     * @param projectId ID of the project
     * @return Percentage funded (scaled by 100, so 100% = 10000)
     */
    function getFundingProgress(uint256 projectId) external view returns (uint256) {
        Project memory project = projects[projectId];
        if (project.targetAmountUSDC == 0) return 0;
        
        return (project.fundedAmountUSDC * 10000) / project.targetAmountUSDC;
    }
    
    /**
     * @dev Get total number of projects
     */
    function getTotalProjects() external view returns (uint256) {
        return _projectIds.current();
    }
}