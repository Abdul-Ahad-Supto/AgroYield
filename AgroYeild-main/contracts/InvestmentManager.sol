// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ProjectFactory.sol";

/**
 * @title InvestmentManager
 * @dev Manages investments in farming projects
 */
contract InvestmentManager is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    
    // Investment structure
    struct Investment {
        address investor;
        uint256 projectId;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }
    
    // State variables
    ProjectFactory public projectFactory;
    mapping(uint256 => Investment[]) public projectInvestments; // projectId => Investment[]
    mapping(address => uint256[]) public investorProjects; // investor => projectId[]
    mapping(address => mapping(uint256 => uint256)) public investorProjectAmount; // investor => projectId => amount
    
    // Events
    event Invested(address indexed investor, uint256 indexed projectId, uint256 amount);
    event Withdrawn(address indexed investor, uint256 indexed projectId, uint256 amount);
    
    constructor(address _projectFactoryAddress) {
        require(_projectFactoryAddress != address(0), "Invalid project factory address");
        projectFactory = ProjectFactory(_projectFactoryAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Invest in a project
     * @param projectId ID of the project to invest in
     */
    function invest(uint256 projectId) external payable nonReentrant onlyRole(INVESTOR_ROLE) {
        require(msg.value > 0, "Investment amount must be greater than 0");
        
        // Get project details from ProjectFactory
        (bool success, bytes memory data) = address(projectFactory).staticcall(
            abi.encodeWithSignature("getProject(uint256)", projectId)
        );
        require(success, "Failed to fetch project details");
        
        ProjectFactory.Project memory project = abi.decode(data, (ProjectFactory.Project));
        
        require(project.status == ProjectFactory.ProjectStatus.Approved, "Project not available for investment");
        require(project.fundedAmount + msg.value <= project.targetAmount, "Investment exceeds target amount");
        
        // Update project funding
        project.fundedAmount += msg.value;
        
        // Create new investment
        Investment memory newInvestment = Investment({
            investor: msg.sender,
            projectId: projectId,
            amount: msg.value,
            timestamp: block.timestamp,
            claimed: false
        });
        
        projectInvestments[projectId].push(newInvestment);
        
        // Update investor's project list if not already invested
        if (investorProjectAmount[msg.sender][projectId] == 0) {
            investorProjects[msg.sender].push(projectId);
        }
        
        investorProjectAmount[msg.sender][projectId] += msg.value;
        
        emit Invested(msg.sender, projectId, msg.value);
    }
    
    /**
     * @dev Get investments by project ID
     * @param projectId ID of the project
     * @return Array of investments in the project
     */
    function getProjectInvestments(uint256 projectId) external view returns (Investment[] memory) {
        return projectInvestments[projectId];
    }
    
    /**
     * @dev Get investor's projects
     * @param investor Address of the investor
     * @return Array of project IDs the investor has invested in
     */
    function getInvestorProjects(address investor) external view returns (uint256[] memory) {
        return investorProjects[investor];
    }
    
    /**
     * @dev Get investor's total investment in a project
     * @param investor Address of the investor
     * @param projectId ID of the project
     * @return Total amount invested
     */
    function getInvestorProjectInvestment(address investor, uint256 projectId) external view returns (uint256) {
        return investorProjectAmount[investor][projectId];
    }
    
    // Additional functions for project completion and fund distribution will be added in YieldDistributor
}
