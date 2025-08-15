// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ProjectFactory.sol";

/**
 * @title InvestmentManager
 * @dev Manages USDC investments in farming projects with yield distribution
 */
contract InvestmentManager is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    
    // Role definitions
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    bytes32 public constant PROJECT_MANAGER_ROLE = keccak256("PROJECT_MANAGER_ROLE");
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    
    // Investment structure
    struct Investment {
        address investor;
        uint256 projectId;
        uint256 amountUSDC; // Amount in USDC (6 decimals)
        uint256 timestamp;
        bool claimed;
        uint256 expectedReturnUSDC; // Expected return in USDC
        uint256 actualReturnUSDC; // Actual return received
    }
    
    // Project loan tracking
    struct ProjectLoan {
        uint256 principalAmount; // Total USDC borrowed
        uint256 yieldAmount; // 12% annual yield owed
        uint256 totalRepayment; // Principal + yield
        uint256 repaidAmount; // Amount repaid so far
        bool isFullyRepaid; // Whether loan is fully repaid
        uint256 repaymentDeadline; // When repayment is due
        address farmer; // Farmer who borrowed
    }
    
    // State variables
    ProjectFactory public projectFactory;
    IERC20 public immutable USDC;
    
    mapping(uint256 => Investment[]) public projectInvestments; // projectId => Investment[]
    mapping(address => uint256[]) public investorProjects; // investor => projectId[]
    mapping(address => mapping(uint256 => uint256)) public investorProjectAmount; // investor => projectId => amount USDC
    mapping(uint256 => uint256) public projectFunding; // projectId => total funded amount USDC
    
    // Yield distribution tracking
    mapping(uint256 => ProjectLoan) public projectLoans; // projectId => loan details
    mapping(uint256 => bool) public projectCompleted; // projectId => completion status
    mapping(uint256 => uint256) public projectRepaymentAmount; // projectId => total repaid
    mapping(address => uint256) public pendingYields; // investor => pending yield to claim
    
    // Investment limits and fees
    uint256 public constant MIN_INVESTMENT_USDC = 10 * 1e6; // 10 USDC minimum
    uint256 public constant PLATFORM_FEE_PERCENT = 150; // 1.5% (scaled by 10000)
    uint256 public constant ANNUAL_YIELD_RATE = 1200; // 12% annual yield (scaled by 10000)
    uint256 public constant REPAYMENT_GRACE_PERIOD = 30 days; // Grace period after project end
    
    // Events
    event Invested(
        address indexed investor, 
        uint256 indexed projectId, 
        uint256 amountUSDC, 
        uint256 amountBDT
    );
    event Withdrawn(address indexed investor, uint256 indexed projectId, uint256 amountUSDC);
    event PlatformFeeCollected(uint256 projectId, uint256 feeUSDC);
    event LoanRepaid(uint256 indexed projectId, uint256 totalAmount, address farmer);
    event YieldDistributed(uint256 indexed projectId, uint256 totalYield, uint256 investorCount);
    event YieldClaimed(address indexed investor, uint256 amount);
    event ProjectDefaulted(uint256 indexed projectId, uint256 amountOwed);
    event FundsReleasedToFarmer(uint256 indexed projectId, uint256 amount, address farmer);
    
    constructor(address _projectFactoryAddress, address _usdcAddress) {
        require(_projectFactoryAddress != address(0), "Invalid project factory address");
        require(_usdcAddress != address(0), "Invalid USDC address");
        
        projectFactory = ProjectFactory(_projectFactoryAddress);
        USDC = IERC20(_usdcAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Invest USDC in a project
     * @param projectId ID of the project to invest in
     * @param amountUSDC Amount to invest in USDC (6 decimals)
     */
    function invest(uint256 projectId, uint256 amountUSDC) external nonReentrant onlyRole(INVESTOR_ROLE) {
        require(amountUSDC >= MIN_INVESTMENT_USDC, "Investment below minimum");
        require(USDC.balanceOf(msg.sender) >= amountUSDC, "Insufficient USDC balance");
        
        // Get project details
        ProjectFactory.Project memory project = projectFactory.getProject(projectId);
        require(project.status == ProjectFactory.ProjectStatus.Approved, "Project not available for investment");
        require(projectFunding[projectId] + amountUSDC <= project.targetAmountUSDC, "Investment exceeds target");
        require(!projectCompleted[projectId], "Project already completed");
        
        // Transfer USDC from investor
        USDC.safeTransferFrom(msg.sender, address(this), amountUSDC);
        
        // Calculate platform fee
        uint256 platformFee = (amountUSDC * PLATFORM_FEE_PERCENT) / 10000;
        uint256 netInvestment = amountUSDC - platformFee;
        
        // Update project funding
        projectFunding[projectId] += netInvestment;
        
        // Calculate expected return (12% annual return, prorated)
        uint256 projectDuration = _getProjectDuration(project);
        uint256 expectedReturn = calculateExpectedReturn(netInvestment, projectDuration);
        
        // Create investment record
        Investment memory newInvestment = Investment({
            investor: msg.sender,
            projectId: projectId,
            amountUSDC: netInvestment,
            timestamp: block.timestamp,
            claimed: false,
            expectedReturnUSDC: expectedReturn,
            actualReturnUSDC: 0
        });
        
        projectInvestments[projectId].push(newInvestment);
        
        // Update investor tracking
        if (investorProjectAmount[msg.sender][projectId] == 0) {
            investorProjects[msg.sender].push(projectId);
        }
        investorProjectAmount[msg.sender][projectId] += netInvestment;
        
        // Initialize or update project loan tracking
        if (projectLoans[projectId].principalAmount == 0) {
            _initializeProjectLoan(projectId, project);
        }
        projectLoans[projectId].principalAmount += netInvestment;
        
        // Update project funding in ProjectFactory
        projectFactory.updateFunding(projectId, netInvestment);
        
        // Convert to BDT for display purposes
        uint256 amountBDT = projectFactory.convertUSDCToBDT(amountUSDC);
        
        emit Invested(msg.sender, projectId, amountUSDC, amountBDT);
        emit PlatformFeeCollected(projectId, platformFee);
    }
    
    /**
     * @dev Farmer repays loan with 12% annual yield
     * @param projectId ID of the project to repay
     */
    function repayLoan(uint256 projectId) external payable nonReentrant {
        ProjectLoan storage loan = projectLoans[projectId];
        require(loan.principalAmount > 0, "No loan exists for this project");
        require(!loan.isFullyRepaid, "Loan already fully repaid");
        
        // Verify caller is the project farmer
        ProjectFactory.Project memory project = projectFactory.getProject(projectId);
        require(project.farmer == msg.sender, "Only project farmer can repay");
        
        // Calculate total repayment needed
        uint256 projectDuration = _getActualProjectDuration(project);
        uint256 totalYield = calculateExpectedReturn(loan.principalAmount, projectDuration);
        uint256 totalRepayment = loan.principalAmount + totalYield;
        
        require(msg.value >= totalRepayment, "Insufficient repayment amount");
        
        // Update loan status
        loan.yieldAmount = totalYield;
        loan.totalRepayment = totalRepayment;
        loan.repaidAmount = msg.value;
        loan.isFullyRepaid = true;
        
        // Mark project as completed
        projectCompleted[projectId] = true;
        projectRepaymentAmount[projectId] = msg.value;
        
        // Distribute yield to all investors
        _distributeYield(projectId, totalYield);
        
        emit LoanRepaid(projectId, msg.value, msg.sender);
    }
    
    /**
     * @dev Internal function to distribute yield to all investors
     * @param projectId Project ID
     * @param totalYield Total yield to distribute
     */
    function _distributeYield(uint256 projectId, uint256 totalYield) internal {
        Investment[] storage investments = projectInvestments[projectId];
        uint256 totalPrincipal = projectLoans[projectId].principalAmount;
        uint256 distributedCount = 0;
        
        for (uint256 i = 0; i < investments.length; i++) {
            if (!investments[i].claimed) {
                // Calculate investor's proportional share of yield
                uint256 investorShare = (investments[i].amountUSDC * totalYield) / totalPrincipal;
                uint256 totalReturn = investments[i].amountUSDC + investorShare;
                
                // Update investment record
                investments[i].actualReturnUSDC = investorShare;
                investments[i].claimed = true;
                
                // Add to pending yields for claiming
                pendingYields[investments[i].investor] += totalReturn;
                
                distributedCount++;
            }
        }
        
        emit YieldDistributed(projectId, totalYield, distributedCount);
    }
    
    /**
     * @dev Investor claims their yield from completed projects
     */
    function claimYield() external nonReentrant {
        uint256 pendingAmount = pendingYields[msg.sender];
        require(pendingAmount > 0, "No yield to claim");
        
        pendingYields[msg.sender] = 0;
        
        // Transfer yield + principal back to investor
        (bool success, ) = payable(msg.sender).call{value: pendingAmount}("");
        require(success, "Yield transfer failed");
        
        emit YieldClaimed(msg.sender, pendingAmount);
    }
    
    /**
     * @dev Calculate expected return for an investment
     * @param amountUSDC Investment amount in USDC
     * @param durationDays Duration in days
     * @return Expected return in USDC
     */
    function calculateExpectedReturn(uint256 amountUSDC, uint256 durationDays) public pure returns (uint256) {
        // 12% annual return = 12% / 365 days
        // Return = principal * rate * time
        return (amountUSDC * ANNUAL_YIELD_RATE * durationDays) / (365 * 10000);
    }
    
    /**
     * @dev Get total repayment required for a project
     * @param projectId Project ID
     * @return Total amount farmer needs to repay (principal + 12% yield)
     */
    function getRequiredRepayment(uint256 projectId) external view returns (uint256) {
        ProjectLoan memory loan = projectLoans[projectId];
        if (loan.principalAmount == 0) return 0;
        
        ProjectFactory.Project memory project = projectFactory.getProject(projectId);
        uint256 projectDuration = _getActualProjectDuration(project);
        uint256 totalYield = calculateExpectedReturn(loan.principalAmount, projectDuration);
        
        return loan.principalAmount + totalYield;
    }
    
    /**
     * @dev Get yield information for a project
     * @param projectId Project ID
     * @return Comprehensive loan and yield information
     */
    function getProjectYieldInfo(uint256 projectId) external view returns (
        bool isCompleted,
        uint256 principalAmount,
        uint256 yieldAmount,
        uint256 totalRepayment,
        bool isFullyRepaid,
        uint256 repaymentDeadline,
        address farmer
    ) {
        ProjectLoan memory loan = projectLoans[projectId];
        isCompleted = projectCompleted[projectId];
        principalAmount = loan.principalAmount;
        yieldAmount = loan.yieldAmount;
        totalRepayment = loan.totalRepayment;
        isFullyRepaid = loan.isFullyRepaid;
        repaymentDeadline = loan.repaymentDeadline;
        farmer = loan.farmer;
    }
    
    /**
     * @dev Check if investor can claim yield and how much
     * @param investor Investor address
     * @return claimableAmount Amount available to claim
     */
    function getClaimableYield(address investor) external view returns (uint256 claimableAmount) {
        return pendingYields[investor];
    }
    
    /**
     * @dev Get detailed investment information for an investor in a project
     * @param investor Investor address
     * @param projectId Project ID
     * @return Investment details including yield status
     */
    function getInvestorProjectDetails(address investor, uint256 projectId) 
        external view returns (
            uint256 amountUSDC, 
            uint256 amountBDT, 
            uint256 expectedReturnUSDC,
            uint256 actualReturnUSDC,
            bool yieldClaimed,
            bool projectCompleted_
        ) 
    {
        amountUSDC = investorProjectAmount[investor][projectId];
        amountBDT = projectFactory.convertUSDCToBDT(amountUSDC);
        projectCompleted_ = projectCompleted[projectId];
        
        // Calculate total expected and actual returns for this investor
        Investment[] memory investments = projectInvestments[projectId];
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].investor == investor) {
                expectedReturnUSDC += investments[i].expectedReturnUSDC;
                actualReturnUSDC += investments[i].actualReturnUSDC;
                yieldClaimed = investments[i].claimed;
            }
        }
    }
    
    /**
     * @dev Release funds to farmer upon milestone completion
     * @param projectId Project ID
     * @param amountUSDC Amount to release
     * @param farmer Farmer address
     */
    function releaseFundsToFarmer(
        uint256 projectId, 
        uint256 amountUSDC, 
        address farmer
    ) external onlyRole(PROJECT_MANAGER_ROLE) {
        require(projectFunding[projectId] >= amountUSDC, "Insufficient project funds");
        require(!projectCompleted[projectId], "Project already completed");
        
        projectFunding[projectId] -= amountUSDC;
        USDC.safeTransfer(farmer, amountUSDC);
        
        emit FundsReleasedToFarmer(projectId, amountUSDC, farmer);
    }
    
    /**
     * @dev Mark project as defaulted if not repaid within grace period
     * @param projectId Project ID
     */
    function markProjectDefaulted(uint256 projectId) external onlyRole(PROJECT_MANAGER_ROLE) {
        ProjectLoan memory loan = projectLoans[projectId];
        require(loan.principalAmount > 0, "No loan exists");
        require(!loan.isFullyRepaid, "Loan already repaid");
        require(block.timestamp > loan.repaymentDeadline, "Repayment deadline not passed");
        
        // In a real implementation, this would trigger insurance claims or other recovery mechanisms
        emit ProjectDefaulted(projectId, loan.principalAmount + loan.yieldAmount);
    }
    
    // ... [Previous functions remain the same] ...
    
    /**
     * @dev Get total funding for a project in USDC
     */
    function getProjectFundingUSDC(uint256 projectId) external view returns (uint256) {
        return projectFunding[projectId];
    }
    
    /**
     * @dev Get total funding for a project in BDT
     */
    function getProjectFundingBDT(uint256 projectId) external view returns (uint256) {
        return projectFactory.convertUSDCToBDT(projectFunding[projectId]);
    }
    
    /**
     * @dev Get investments by project ID
     */
    function getProjectInvestments(uint256 projectId) external view returns (Investment[] memory) {
        return projectInvestments[projectId];
    }
    
    /**
     * @dev Get investor's projects
     */
    function getInvestorProjects(address investor) external view returns (uint256[] memory) {
        return investorProjects[investor];
    }
    
    /**
     * @dev Get investment share percentage for an investor in a project
     */
    function getInvestmentShare(address investor, uint256 projectId) external view returns (uint256) {
        uint256 totalFunding = projectFunding[projectId];
        if (totalFunding == 0) return 0;
        
        uint256 investorAmount = investorProjectAmount[investor][projectId];
        return (investorAmount * 10000) / totalFunding;
    }
    
    /**
     * @dev Emergency withdraw function (admin only)
     */
    function emergencyWithdraw(uint256 amountUSDC) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(USDC.balanceOf(address(this)) >= amountUSDC, "Insufficient contract balance");
        USDC.safeTransfer(msg.sender, amountUSDC);
    }
    
    /**
     * @dev Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return USDC.balanceOf(address(this));
    }
    
    /**
     * @dev Get contract ETH balance (for yield payments)
     */
    function getContractETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Helper function to get project duration from project data
     */
    function _getProjectDuration(ProjectFactory.Project memory project) internal pure returns (uint256) {
        if (project.endDate > project.startDate) {
            return (project.endDate - project.startDate) / 86400; // Convert to days
        }
        return 90; // Default 90 days
    }
    
    /**
     * @dev Helper function to get actual project duration (for completed projects)
     */
    function _getActualProjectDuration(ProjectFactory.Project memory project) internal view returns (uint256) {
        if (block.timestamp > project.startDate) {
            return (block.timestamp - project.startDate) / 86400; // Convert to days
        }
        return _getProjectDuration(project);
    }
    
    /**
     * @dev Initialize loan tracking for a new project
     */
    function _initializeProjectLoan(uint256 projectId, ProjectFactory.Project memory project) internal {
        projectLoans[projectId] = ProjectLoan({
            principalAmount: 0,
            yieldAmount: 0,
            totalRepayment: 0,
            repaidAmount: 0,
            isFullyRepaid: false,
            repaymentDeadline: project.endDate + REPAYMENT_GRACE_PERIOD,
            farmer: project.farmer
        });
    }
    
    /**
     * @dev Approve this contract to spend investor's USDC (helper function)
     */
    function getApprovalData(uint256 amountUSDC) external view returns (address, bytes memory) {
        return (address(USDC), abi.encodeWithSignature("approve(address,uint256)", address(this), amountUSDC));
    }
    
    // Allow contract to receive ETH for yield payments
    receive() external payable {}
}