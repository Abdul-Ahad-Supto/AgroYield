// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProjectFactory - Updated for OpenZeppelin v5.4.0
 * @dev Fully decentralized project creation with IPFS integration
 */
contract ProjectFactory is ReentrancyGuard {
    // Remove Counters - use simple uint256 instead
    uint256 private _projectIdCounter;
    uint256 private _userCounter;
    
    // Project status enum - simplified
    enum ProjectStatus { Active, Completed, Cancelled }
    
    // User profile structure
    struct UserProfile {
        bool isRegistered;
        string name;
        string profileIPFSHash;
        uint256 registeredAt;
        uint256 projectCount;
        uint256 totalInvested;
        uint256 totalRaised;
    }
    
    // Project structure with IPFS integration
    struct Project {
        uint256 id;
        address farmer;
        string title;
        string description;
        string imageIPFSHash;
        string documentsIPFSHash;
        uint256 targetAmountUSDC;
        uint256 currentAmountUSDC;
        uint256 durationDays;
        uint256 createdAt;
        uint256 deadline;
        ProjectStatus status;
        string location;
        string category;
        uint256 investorCount;
        bool fundsReleased;
    }
    
    // Investment tracking
    struct Investment {
        address investor;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }
    
    // State variables
    mapping(uint256 => Project) public projects;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => uint256[]) public userProjects;
    mapping(uint256 => Investment[]) public projectInvestments;
    mapping(address => uint256[]) public userInvestments;
    
    // Platform constants
    uint256 public constant MIN_FUNDING_AMOUNT = 10 * 1e6; // 10 USDC
    uint256 public constant MAX_FUNDING_AMOUNT = 100000 * 1e6; // 100k USDC
    uint256 public constant MIN_DURATION_DAYS = 30;
    uint256 public constant MAX_DURATION_DAYS = 365;
    
    // Events
    event UserRegistered(
        address indexed user, 
        string name, 
        string profileIPFSHash,
        uint256 timestamp
    );
    
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed farmer,
        string title,
        uint256 targetAmountUSDC,
        string imageIPFSHash,
        uint256 deadline
    );
    
    event ProjectInvestment(
        uint256 indexed projectId,
        address indexed investor,
        uint256 amount,
        uint256 newTotal
    );
    
    event ProjectCompleted(
        uint256 indexed projectId,
        uint256 totalRaised,
        uint256 investorCount
    );
    
    event FundsReleased(
        uint256 indexed projectId,
        address indexed farmer,
        uint256 amount
    );
    
    /**
     * @dev Register a new user (farmer or investor)
     */
    function registerUser(
        string memory name,
        string memory profileIPFSHash
    ) external {
        require(!userProfiles[msg.sender].isRegistered, "User already registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        userProfiles[msg.sender] = UserProfile({
            isRegistered: true,
            name: name,
            profileIPFSHash: profileIPFSHash,
            registeredAt: block.timestamp,
            projectCount: 0,
            totalInvested: 0,
            totalRaised: 0
        });
        
        _userCounter++;
        
        emit UserRegistered(msg.sender, name, profileIPFSHash, block.timestamp);
    }
    
    /**
     * @dev Create a new farming project
     */
    function createProject(
        string memory title,
        string memory description,
        string memory imageIPFSHash,
        string memory documentsIPFSHash,
        uint256 targetAmountUSDC,
        uint256 durationDays,
        string memory location,
        string memory category
    ) external nonReentrant {
        require(userProfiles[msg.sender].isRegistered, "User not registered");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(imageIPFSHash).length > 0, "Image IPFS hash required");
        require(
            targetAmountUSDC >= MIN_FUNDING_AMOUNT && 
            targetAmountUSDC <= MAX_FUNDING_AMOUNT,
            "Invalid funding amount"
        );
        require(
            durationDays >= MIN_DURATION_DAYS && 
            durationDays <= MAX_DURATION_DAYS,
            "Invalid duration"
        );
        
        _projectIdCounter++;
        uint256 projectId = _projectIdCounter;
        uint256 deadline = block.timestamp + (durationDays * 1 days);
        
        // Split project creation to avoid stack too deep
        _createProjectStorage(
            projectId,
            title,
            description,
            imageIPFSHash,
            documentsIPFSHash,
            targetAmountUSDC,
            durationDays,
            deadline,
            location,
            category
        );
        
        userProjects[msg.sender].push(projectId);
        userProfiles[msg.sender].projectCount++;
        
        emit ProjectCreated(
            projectId,
            msg.sender,
            title,
            targetAmountUSDC,
            imageIPFSHash,
            deadline
        );
    }
    
    /**
     * @dev Internal function to create project storage (reduces stack depth)
     */
    function _createProjectStorage(
        uint256 projectId,
        string memory title,
        string memory description,
        string memory imageIPFSHash,
        string memory documentsIPFSHash,
        uint256 targetAmountUSDC,
        uint256 durationDays,
        uint256 deadline,
        string memory location,
        string memory category
    ) internal {
        projects[projectId] = Project({
            id: projectId,
            farmer: msg.sender,
            title: title,
            description: description,
            imageIPFSHash: imageIPFSHash,
            documentsIPFSHash: documentsIPFSHash,
            targetAmountUSDC: targetAmountUSDC,
            currentAmountUSDC: 0,
            durationDays: durationDays,
            createdAt: block.timestamp,
            deadline: deadline,
            status: ProjectStatus.Active,
            location: location,
            category: category,
            investorCount: 0,
            fundsReleased: false
        });
    }
    
    /**
     * @dev Record investment (called by InvestmentManager)
     */
    function recordInvestment(
        uint256 projectId,
        address investor,
        uint256 amount
    ) external {
        require(projects[projectId].id != 0, "Project does not exist");
        require(projects[projectId].status == ProjectStatus.Active, "Project not active");
        require(block.timestamp <= projects[projectId].deadline, "Funding period ended");
        require(
            projects[projectId].currentAmountUSDC + amount <= projects[projectId].targetAmountUSDC,
            "Investment exceeds target"
        );
        
        // Create investment record
        projectInvestments[projectId].push(Investment({
            investor: investor,
            amount: amount,
            timestamp: block.timestamp,
            claimed: false
        }));
        
        // Update project funding
        projects[projectId].currentAmountUSDC += amount;
        
        // Check if new investor
        _updateInvestorRecord(projectId, investor, amount);
        
        emit ProjectInvestment(
            projectId,
            investor,
            amount,
            projects[projectId].currentAmountUSDC
        );
        
        // Check if fully funded
        _checkProjectCompletion(projectId);
    }
    
    /**
     * @dev Internal function to update investor records
     */
    function _updateInvestorRecord(
        uint256 projectId,
        address investor,
        uint256 amount
    ) internal {
        bool isNewInvestor = true;
        uint256[] memory investments = userInvestments[investor];
        
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i] == projectId) {
                isNewInvestor = false;
                break;
            }
        }
        
        if (isNewInvestor) {
            userInvestments[investor].push(projectId);
            projects[projectId].investorCount++;
        }
        
        userProfiles[investor].totalInvested += amount;
    }
    
    /**
     * @dev Internal function to check if project is fully funded
     */
    function _checkProjectCompletion(uint256 projectId) internal {
        if (projects[projectId].currentAmountUSDC >= projects[projectId].targetAmountUSDC) {
            projects[projectId].status = ProjectStatus.Completed;
            userProfiles[projects[projectId].farmer].totalRaised += projects[projectId].currentAmountUSDC;
            
            emit ProjectCompleted(
                projectId,
                projects[projectId].currentAmountUSDC,
                projects[projectId].investorCount
            );
        }
    }
    
    // Add getter function for individual project
    function getProject(uint256 projectId) external view returns (Project memory) {
        return projects[projectId];
    }
    
    // View functions
    function getAllProjects() external view returns (Project[] memory) {
        Project[] memory allProjects = new Project[](_projectIdCounter);
        
        for (uint256 i = 1; i <= _projectIdCounter; i++) {
            allProjects[i - 1] = projects[i];
        }
        
        return allProjects;
    }
    
    function getActiveProjects() external view returns (Project[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i <= _projectIdCounter; i++) {
            if (projects[i].status == ProjectStatus.Active && 
                block.timestamp <= projects[i].deadline) {
                activeCount++;
            }
        }
        
        Project[] memory activeProjects = new Project[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= _projectIdCounter; i++) {
            if (projects[i].status == ProjectStatus.Active && 
                block.timestamp <= projects[i].deadline) {
                activeProjects[currentIndex] = projects[i];
                currentIndex++;
            }
        }
        
        return activeProjects;
    }
    
    function getProjectsByFarmer(address farmer) external view returns (uint256[] memory) {
        return userProjects[farmer];
    }
    
    function getInvestmentsByUser(address investor) external view returns (uint256[] memory) {
        return userInvestments[investor];
    }
    
    function getProjectInvestments(uint256 projectId) external view returns (Investment[] memory) {
        return projectInvestments[projectId];
    }
    
    function isUserRegistered(address user) external view returns (bool) {
        return userProfiles[user].isRegistered;
    }
    
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }
    
    function getFundingProgress(uint256 projectId) external view returns (uint256) {
        Project memory project = projects[projectId];
        if (project.targetAmountUSDC == 0) return 0;
        
        return (project.currentAmountUSDC * 100) / project.targetAmountUSDC;
    }
    
    function getPlatformStats() external view returns (
        uint256 totalProjects,
        uint256 totalUsers,
        uint256 totalInvestments,
        uint256 totalFunding
    ) {
        totalProjects = _projectIdCounter;
        totalUsers = _userCounter;
        
        for (uint256 i = 1; i <= _projectIdCounter; i++) {
            totalInvestments += projectInvestments[i].length;
            totalFunding += projects[i].currentAmountUSDC;
        }
    }
    
    function getTotalProjects() external view returns (uint256) {
        return _projectIdCounter;
    }
}