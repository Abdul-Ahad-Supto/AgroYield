// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ProjectFactory.sol";

/**
 * @title InvestmentManager - Updated for OpenZeppelin v5.4.0
 * @dev Handles USDC investments without admin controls
 */
contract InvestmentManager is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct InvestorData {
        uint256 totalInvested;
        uint256 activeInvestments;
        uint256 claimedReturns;
        uint256[] projectIds;
    }
    
    struct YieldInfo {
        uint256 principalAmount;
        uint256 expectedReturn;
        uint256 returnDate;
        bool returned;
        bool claimed;
    }
    
    ProjectFactory public immutable projectFactory;
    IERC20 public immutable USDC;
    
    mapping(address => InvestorData) public investors;
    mapping(address => mapping(uint256 => uint256)) public investorProjectAmount;
    mapping(uint256 => YieldInfo) public projectYields;
    mapping(address => uint256) public pendingReturns;
    
    uint256 public constant MIN_INVESTMENT = 10 * 1e6; // 10 USDC
    uint256 public constant MAX_INVESTMENT = 10000 * 1e6; // 10,000 USDC
    uint256 public constant ANNUAL_RETURN_RATE = 1200; // 12%
    uint256 public constant PLATFORM_FEE = 150; // 1.5%
    
    event InvestmentMade(
        address indexed investor,
        uint256 indexed projectId,
        uint256 amountUSDC,
        uint256 platformFee,
        uint256 netInvestment
    );
    
    event ReturnsDistributed(
        uint256 indexed projectId,
        uint256 totalReturns,
        uint256 investorCount
    );
    
    event ReturnsClaimed(
        address indexed investor,
        uint256 amount
    );
    
    event ProjectFunded(
        uint256 indexed projectId,
        uint256 totalAmount,
        uint256 investorCount
    );
    
    constructor(address _projectFactory, address _usdc) {
        require(_projectFactory != address(0), "Invalid project factory");
        require(_usdc != address(0), "Invalid USDC address");
        
        projectFactory = ProjectFactory(_projectFactory);
        USDC = IERC20(_usdc);
    }
    
    function investInProject(uint256 projectId, uint256 amountUSDC) external nonReentrant {
        require(amountUSDC >= MIN_INVESTMENT, "Investment below minimum");
        require(amountUSDC <= MAX_INVESTMENT, "Investment above maximum");
        require(projectFactory.isUserRegistered(msg.sender), "User not registered");
        
        // Split validation and execution to avoid stack depth issues
        _validateInvestment(projectId, amountUSDC);
        _executeInvestment(projectId, amountUSDC);
    }
    
    /**
     * @dev Internal function to validate investment
     */
    function _validateInvestment(uint256 projectId, uint256 amountUSDC) internal view {
        ProjectFactory.Project memory project = projectFactory.getProject(projectId);
        require(project.id != 0, "Project does not exist");
        require(
            project.status == ProjectFactory.ProjectStatus.Active,
            "Project not active for investment"
        );
        require(block.timestamp <= project.deadline, "Investment period ended");
        require(
            project.currentAmountUSDC + amountUSDC <= project.targetAmountUSDC,
            "Investment exceeds target"
        );
    }
    
    /**
     * @dev Internal function to execute investment
     */
    function _executeInvestment(uint256 projectId, uint256 amountUSDC) internal {
        // Transfer USDC
        USDC.safeTransferFrom(msg.sender, address(this), amountUSDC);
        
        // Calculate fees
        uint256 platformFee = (amountUSDC * PLATFORM_FEE) / 10000;
        uint256 netInvestment = amountUSDC - platformFee;
        
        // Record on ProjectFactory
        projectFactory.recordInvestment(projectId, msg.sender, netInvestment);
        
        // Update local records
        _updateInvestorData(projectId, netInvestment);
        
        // Update yield info
        _updateYieldInfo(projectId, netInvestment);
        
        emit InvestmentMade(msg.sender, projectId, amountUSDC, platformFee, netInvestment);
        
        // Check if fully funded
        _checkFundingComplete(projectId);
    }
    
    /**
     * @dev Update investor data
     */
    function _updateInvestorData(uint256 projectId, uint256 netInvestment) internal {
        if (investorProjectAmount[msg.sender][projectId] == 0) {
            investors[msg.sender].projectIds.push(projectId);
            investors[msg.sender].activeInvestments++;
        }
        
        investorProjectAmount[msg.sender][projectId] += netInvestment;
        investors[msg.sender].totalInvested += netInvestment;
    }
    
    /**
     * @dev Update yield information
     */
    function _updateYieldInfo(uint256 projectId, uint256 netInvestment) internal {
        ProjectFactory.Project memory project = projectFactory.getProject(projectId);
        uint256 expectedReturn = calculateExpectedReturn(netInvestment, project.durationDays);
        
        if (projectYields[projectId].principalAmount == 0) {
            projectYields[projectId] = YieldInfo({
                principalAmount: netInvestment,
                expectedReturn: expectedReturn,
                returnDate: project.deadline + 30 days,
                returned: false,
                claimed: false
            });
        } else {
            projectYields[projectId].principalAmount += netInvestment;
            projectYields[projectId].expectedReturn += expectedReturn;
        }
    }
    
    /**
     * @dev Check if funding is complete
     */
    function _checkFundingComplete(uint256 projectId) internal {
        ProjectFactory.Project memory updatedProject = projectFactory.getProject(projectId);
        if (updatedProject.currentAmountUSDC >= updatedProject.targetAmountUSDC) {
            emit ProjectFunded(
                projectId,
                updatedProject.currentAmountUSDC,
                updatedProject.investorCount
            );
        }
    }
    
    function depositReturns(uint256 projectId) external payable nonReentrant {
        // Use getter function instead of direct mapping access
        ProjectFactory.Project memory project = projectFactory.getProject(projectId);
        require(project.farmer == msg.sender, "Only project farmer can deposit returns");
        require(
            project.status == ProjectFactory.ProjectStatus.Completed,
            "Project not completed"
        );
        require(!projectYields[projectId].returned, "Returns already deposited");
        
        YieldInfo storage yieldInfo = projectYields[projectId];
        uint256 expectedTotalReturn = yieldInfo.principalAmount + yieldInfo.expectedReturn;
        
        require(msg.value >= expectedTotalReturn, "Insufficient return amount");
        
        yieldInfo.returned = true;
        _distributeReturns(projectId, msg.value);
        
        emit ReturnsDistributed(projectId, msg.value, project.investorCount);
    }
    
    function _distributeReturns(uint256 projectId, uint256 totalAmount) internal {
        ProjectFactory.Investment[] memory investments = projectFactory.getProjectInvestments(projectId);
        uint256 totalPrincipal = projectYields[projectId].principalAmount;
        
        for (uint256 i = 0; i < investments.length; i++) {
            address investor = investments[i].investor;
            uint256 investmentAmount = investments[i].amount;
            
            uint256 investorReturn = (totalAmount * investmentAmount) / totalPrincipal;
            pendingReturns[investor] += investorReturn;
        }
    }
    
    function claimReturns() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No returns to claim");
        
        pendingReturns[msg.sender] = 0;
        investors[msg.sender].claimedReturns += amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Return transfer failed");
        
        emit ReturnsClaimed(msg.sender, amount);
    }
    
    function calculateExpectedReturn(
        uint256 principalAmount,
        uint256 durationDays
    ) public pure returns (uint256) {
        return (principalAmount * ANNUAL_RETURN_RATE * durationDays) / (365 * 10000);
    }
    
    // View functions
    function getInvestorData(address investor) external view returns (
        uint256 totalInvested,
        uint256 activeInvestments,
        uint256 claimedReturns,
        uint256 pendingAmount,
        uint256[] memory projectIds
    ) {
        InvestorData memory data = investors[investor];
        return (
            data.totalInvested,
            data.activeInvestments,
            data.claimedReturns,
            pendingReturns[investor],
            data.projectIds
        );
    }
    
    function getInvestmentAmount(
        address investor,
        uint256 projectId
    ) external view returns (uint256) {
        return investorProjectAmount[investor][projectId];
    }
    
    function getProjectYieldInfo(uint256 projectId) external view returns (
        uint256 principalAmount,
        uint256 expectedReturn,
        uint256 returnDate,
        bool returned,
        bool claimed
    ) {
        YieldInfo memory yieldInfo = projectYields[projectId];
        return (
            yieldInfo.principalAmount,
            yieldInfo.expectedReturn,
            yieldInfo.returnDate,
            yieldInfo.returned,
            yieldInfo.claimed
        );
    }
    
    function getPendingReturns(address investor) external view returns (uint256) {
        return pendingReturns[investor];
    }
    
    function getContractBalances() external view returns (
        uint256 usdcBalance,
        uint256 ethBalance
    ) {
        return (
            USDC.balanceOf(address(this)),
            address(this).balance
        );
    }
    
    receive() external payable {}
}