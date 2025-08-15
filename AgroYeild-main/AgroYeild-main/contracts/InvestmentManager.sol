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
 * @dev Manages USDC investments in farming projects
 */
contract InvestmentManager is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    
    // Role definitions
    bytes32 public constant INVESTOR_ROLE = keccak256("INVESTOR_ROLE");
    bytes32 public constant PROJECT_MANAGER_ROLE = keccak256("PROJECT_MANAGER_ROLE");
    
    // Investment structure
    struct Investment {
        address investor;
        uint256 projectId;
        uint256 amountUSDC; // Amount in USDC (6 decimals)
        uint256 timestamp;
        bool claimed;
        uint256 expectedReturnUSDC; // Expected return in USDC
    }
    
    // State variables
    ProjectFactory public projectFactory;
    IERC20 public immutable USDC;
    
    mapping(uint256 => Investment[]) public projectInvestments; // projectId => Investment[]
    mapping(address => uint256[]) public investorProjects; // investor => projectId[]
    mapping(address => mapping(uint256 => uint256)) public investorProjectAmount; // investor => projectId => amount USDC
    mapping(uint256 => uint256) public projectFunding; // projectId => total funded amount USDC
    
    // Investment limits and fees
    uint256 public constant MIN_INVESTMENT_USDC = 10 * 1e6; // 10 USDC minimum
    uint256 public constant PLATFORM_FEE_PERCENT = 150; // 1.5% (scaled by 10000)
    
    // Events
    event Invested(
        address indexed investor, 
        uint256 indexed projectId, 
        uint256 amountUSDC, 
        uint256 amountBDT
    );
    event Withdrawn(address indexed investor, uint256 indexed projectId, uint256 amountUSDC);
    event PlatformFeeCollected(uint256 projectId, uint256 feeUSDC);
    
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
        
        // Transfer USDC from investor
        USDC.safeTransferFrom(msg.sender, address(this), amountUSDC);
        
        // Calculate platform fee
        uint256 platformFee = (amountUSDC * PLATFORM_FEE_PERCENT) / 10000;
        uint256 netInvestment = amountUSDC - platformFee;
        
        // Update project funding
        projectFunding[projectId] += netInvestment;
        
        // Calculate expected return (example: 12% annual return, prorated)
        uint256 expectedReturn = calculateExpectedReturn(netInvestment, 90); // 90 days default
        
        // Create investment record
        Investment memory newInvestment = Investment({
            investor: msg.sender,
            projectId: projectId,
            amountUSDC: netInvestment,
            timestamp: block.timestamp,
            claimed: false,
            expectedReturnUSDC: expectedReturn
        });
        
        projectInvestments[projectId].push(newInvestment);
        
        // Update investor tracking
        if (investorProjectAmount[msg.sender][projectId] == 0) {
            investorProjects[msg.sender].push(projectId);
        }
        investorProjectAmount[msg.sender][projectId] += netInvestment;
        
        // Update project funding in ProjectFactory
        projectFactory.updateFunding(projectId, netInvestment);
        
        // Convert to BDT for display purposes
        uint256 amountBDT = projectFactory.convertUSDCToBDT(amountUSDC);
        
        emit Invested(msg.sender, projectId, amountUSDC, amountBDT);
        emit PlatformFeeCollected(projectId, platformFee);
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
        uint256 dailyRate = 1200; // 12% * 100 for precision
        return (amountUSDC * dailyRate * durationDays) / (365 * 10000);
    }
    
    /**
     * @dev Get total funding for a project in USDC
     * @param projectId ID of the project
     * @return Total amount funded in USDC
     */
    function getProjectFundingUSDC(uint256 projectId) external view returns (uint256) {
        return projectFunding[projectId];
    }
    
    /**
     * @dev Get total funding for a project in BDT
     * @param projectId ID of the project
     * @return Total amount funded in BDT (scaled by 100)
     */
    function getProjectFundingBDT(uint256 projectId) external view returns (uint256) {
        return projectFactory.convertUSDCToBDT(projectFunding[projectId]);
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
     * @dev Get investor's investment details for a project
     * @param investor Address of the investor
     * @param projectId ID of the project
     * @return amountUSDC Total USDC invested
     * @return amountBDT Total BDT equivalent
     * @return expectedReturnUSDC Expected return in USDC
     */
    function getInvestorProjectDetails(address investor, uint256 projectId) 
        external view returns (uint256 amountUSDC, uint256 amountBDT, uint256 expectedReturnUSDC) 
    {
        amountUSDC = investorProjectAmount[investor][projectId];
        amountBDT = projectFactory.convertUSDCToBDT(amountUSDC);
        
        // Calculate total expected return for this investor in this project
        Investment[] memory investments = projectInvestments[projectId];
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].investor == investor) {
                expectedReturnUSDC += investments[i].expectedReturnUSDC;
            }
        }
    }
    
    /**
     * @dev Get investment share percentage for an investor in a project
     * @param investor Address of the investor
     * @param projectId ID of the project
     * @return Share percentage (scaled by 10000, so 100% = 10000)
     */
    function getInvestmentShare(address investor, uint256 projectId) external view returns (uint256) {
        uint256 totalFunding = projectFunding[projectId];
        if (totalFunding == 0) return 0;
        
        uint256 investorAmount = investorProjectAmount[investor][projectId];
        return (investorAmount * 10000) / totalFunding;
    }
    
    /**
     * @dev Transfer funds to farmer upon project milestone completion
     * @param projectId ID of the project
     * @param amountUSDC Amount to transfer in USDC
     * @param farmer Address of the farmer
     */
    function releaseFundsToFarmer(
        uint256 projectId, 
        uint256 amountUSDC, 
        address farmer
    ) external onlyRole(PROJECT_MANAGER_ROLE) {
        require(projectFunding[projectId] >= amountUSDC, "Insufficient project funds");
        
        projectFunding[projectId] -= amountUSDC;
        USDC.safeTransfer(farmer, amountUSDC);
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
     * @dev Approve this contract to spend investor's USDC (helper function)
     * @param amountUSDC Amount to approve
     */
    function getApprovalData(uint256 amountUSDC) external view returns (address, bytes memory) {
        return (address(USDC), abi.encodeWithSignature("approve(address,uint256)", address(this), amountUSDC));
    }
}