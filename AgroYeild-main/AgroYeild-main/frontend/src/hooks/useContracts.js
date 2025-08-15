import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context.Backup';
import { useToast } from '@chakra-ui/react';

export const useContracts = () => {
  const { contracts, signer, account, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Validate network helper
  const validateNetwork = useCallback(async () => {
    if (!signer) return false;
    
    try {
      const network = await signer.provider.getNetwork();
      const expectedChainId = 80002; // Amoy testnet
      
      if (network.chainId !== expectedChainId) {
        toast({
          title: 'Wrong Network',
          description: `Please switch to Polygon Amoy testnet (Chain ID: ${expectedChainId})`,
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Network validation error:', error);
      return false;
    }
  }, [signer, toast]);

  // ==========================================
  // PROJECT FACTORY FUNCTIONS
  // ==========================================

  const createProject = useCallback(async (projectData) => {
    if (!contracts?.projectFactory) {
      throw new Error('ProjectFactory contract not initialized');
    }

    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      // Validate network
      const isValidNetwork = await validateNetwork();
      if (!isValidNetwork) {
        throw new Error('Please switch to Polygon Amoy network');
      }

      // Validate input data
      if (!projectData.title || !projectData.description || !projectData.targetAmount) {
        throw new Error('Missing required project information');
      }

      // Convert BDT amount to scaled format (multiply by 100)
      const targetAmountBDT = Math.floor(parseFloat(projectData.targetAmount) * 100);
      
      if (targetAmountBDT <= 0) {
        throw new Error('Target amount must be greater than 0');
      }

      // Calculate duration in days (default 90)
      const durationDays = projectData.duration || 90;

      console.log('Creating project with data:', {
        title: projectData.title,
        description: projectData.description,
        ipfsHash: projectData.ipfsHash || 'QmDefault',
        targetAmountBDT,
        durationDays,
        location: projectData.location,
        category: projectData.category
      });

      const tx = await contracts.projectFactory.createProject(
        projectData.title,
        projectData.description,
        projectData.ipfsHash || 'QmDefault',
        targetAmountBDT,
        durationDays,
        projectData.location,
        projectData.category
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Get the project ID from the event
      const projectCreatedEvent = receipt.events?.find(
        event => event.event === 'ProjectCreated'
      );
      const projectId = projectCreatedEvent?.args?.projectId?.toString();

      toast({
        title: 'Project Created Successfully!',
        description: `Project ID: ${projectId}. Transaction: ${tx.hash.substring(0, 10)}...`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return { projectId, txHash: tx.hash, receipt };
    } catch (error) {
      console.error('Create project error:', error);
      
      let errorMessage = 'Failed to create project';
      
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Project Creation Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contracts?.projectFactory, isConnected, validateNetwork, toast]);

  const getProject = useCallback(async (projectId) => {
    if (!contracts?.projectFactory) return null;

    try {
      console.log('Fetching project:', projectId);
      const project = await contracts.projectFactory.getProject(projectId);
      
      return {
        id: project.id.toString(),
        farmer: project.farmer,
        title: project.title,
        description: project.description,
        ipfsHash: project.ipfsHash,
        targetAmountBDT: project.targetAmountBDT.toString(),
        targetAmountUSDC: project.targetAmountUSDC.toString(),
        fundedAmountUSDC: project.fundedAmountUSDC.toString(),
        startDate: project.startDate.toString(),
        endDate: project.endDate.toString(),
        status: project.status,
        isVerified: project.isVerified,
        location: project.location,
        category: project.category
      };
    } catch (error) {
      console.error('Get project error:', error);
      return null;
    }
  }, [contracts?.projectFactory]);

  const getAllProjects = useCallback(async () => {
    if (!contracts?.projectFactory) return [];

    try {
      const totalProjects = await contracts.projectFactory.getTotalProjects();
      const projects = [];

      console.log('Total projects:', totalProjects.toString());

      for (let i = 1; i <= totalProjects.toNumber(); i++) {
        const project = await getProject(i);
        if (project) {
          projects.push(project);
        }
      }

      return projects;
    } catch (error) {
      console.error('Get all projects error:', error);
      return [];
    }
  }, [contracts?.projectFactory, getProject]);

  // ==========================================
  // INVESTMENT MANAGER FUNCTIONS
  // ==========================================

  const investInProject = useCallback(async (projectId, usdcAmount) => {
    if (!contracts?.investmentManager) {
      throw new Error('InvestmentManager contract not initialized');
    }

    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      // Validate network
      const isValidNetwork = await validateNetwork();
      if (!isValidNetwork) {
        throw new Error('Please switch to Polygon Amoy network');
      }

      // Convert USDC amount to proper format (6 decimals)
      const amountUSDC = ethers.utils.parseUnits(usdcAmount.toString(), 6);
      console.log('Investment amount (USDC):', ethers.utils.formatUnits(amountUSDC, 6));
      
      // USDC contract address on Amoy
      const USDC_ADDRESS = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';
      
      // Create USDC contract instance
      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        [
          'function approve(address,uint256) external returns (bool)',
          'function allowance(address,address) external view returns (uint256)',
          'function balanceOf(address) external view returns (uint256)',
          'function decimals() external view returns (uint8)'
        ],
        signer
      );

      // Check USDC balance
      const balance = await usdcContract.balanceOf(account);
      console.log('USDC balance:', ethers.utils.formatUnits(balance, 6));
      
      if (balance.lt(amountUSDC)) {
        throw new Error('Insufficient USDC balance');
      }

      // Check current allowance
      const currentAllowance = await usdcContract.allowance(
        account, 
        contracts.investmentManager.address
      );
      console.log('Current allowance:', ethers.utils.formatUnits(currentAllowance, 6));

      if (currentAllowance.lt(amountUSDC)) {
        toast({
          title: 'Approving USDC...',
          description: 'Please confirm the USDC approval transaction',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        const approveTx = await usdcContract.approve(
          contracts.investmentManager.address,
          amountUSDC
        );
        console.log('Approval transaction:', approveTx.hash);
        await approveTx.wait();
        console.log('USDC approved');
      }

      // Now make the investment
      toast({
        title: 'Processing Investment...',
        description: 'Please confirm the investment transaction',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      console.log('Investing in project:', projectId, 'Amount:', ethers.utils.formatUnits(amountUSDC, 6));
      const tx = await contracts.investmentManager.invest(projectId, amountUSDC);
      console.log('Investment transaction:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Investment confirmed:', receipt);

      toast({
        title: 'Investment Successful!',
        description: `Invested ${usdcAmount} USDC in project ${projectId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return { txHash: tx.hash, receipt };
    } catch (error) {
      console.error('Investment error:', error);
      
      let errorMessage = 'Investment failed';
      
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message.includes('Insufficient USDC balance')) {
        errorMessage = 'Insufficient USDC balance';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Investment Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contracts?.investmentManager, account, signer, isConnected, validateNetwork, toast]);

  const getProjectFunding = useCallback(async (projectId) => {
    if (!contracts?.investmentManager) return { usdcAmount: '0', bdtAmount: '0' };

    try {
      const fundingUSDC = await contracts.investmentManager.getProjectFundingUSDC(projectId);
      const fundingBDT = await contracts.investmentManager.getProjectFundingBDT(projectId);
      
      return {
        usdcAmount: ethers.utils.formatUnits(fundingUSDC, 6),
        bdtAmount: (fundingBDT.toNumber() / 100).toString() // Convert from scaled BDT
      };
    } catch (error) {
      console.error('Get project funding error:', error);
      return { usdcAmount: '0', bdtAmount: '0' };
    }
  }, [contracts?.investmentManager]);

  const getInvestorProjects = useCallback(async (investorAddress) => {
    if (!contracts?.investmentManager) return [];

    try {
      const projectIds = await contracts.investmentManager.getInvestorProjects(investorAddress || account);
      return projectIds.map(id => id.toString());
    } catch (error) {
      console.error('Get investor projects error:', error);
      return [];
    }
  }, [contracts?.investmentManager, account]);

  const getInvestorProjectDetails = useCallback(async (investorAddress, projectId) => {
    if (!contracts?.investmentManager) return { amountUSDC: '0', amountBDT: '0', expectedReturnUSDC: '0' };

    try {
      const details = await contracts.investmentManager.getInvestorProjectDetails(
        investorAddress || account, 
        projectId
      );
      
      return {
        amountUSDC: ethers.utils.formatUnits(details.amountUSDC, 6),
        amountBDT: ethers.utils.formatUnits(details.amountBDT, 2), // BDT has 2 decimal places
        expectedReturnUSDC: ethers.utils.formatUnits(details.expectedReturnUSDC, 6)
      };
    } catch (error) {
      console.error('Get investor project details error:', error);
      return { amountUSDC: '0', amountBDT: '0', expectedReturnUSDC: '0' };
    }
  }, [contracts?.investmentManager, account]);

  // ==========================================
  // GOVERNANCE FUNCTIONS
  // ==========================================

  const createProposal = useCallback(async (title, description, ipfsHash = '') => {
    if (!contracts?.governanceModule) {
      throw new Error('GovernanceModule contract not initialized');
    }

    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const isValidNetwork = await validateNetwork();
      if (!isValidNetwork) {
        throw new Error('Please switch to Polygon Amoy network');
      }

      const tx = await contracts.governanceModule.propose(description, ipfsHash);
      const receipt = await tx.wait();
      
      const proposalCreatedEvent = receipt.events?.find(
        event => event.event === 'ProposalCreated'
      );
      const proposalId = proposalCreatedEvent?.args?.proposalId?.toString();

      toast({
        title: 'Proposal Created!',
        description: `Proposal ID: ${proposalId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return { proposalId, txHash: tx.hash, receipt };
    } catch (error) {
      console.error('Create proposal error:', error);
      
      let errorMessage = 'Failed to create proposal';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Proposal Creation Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contracts?.governanceModule, isConnected, validateNetwork, toast]);

  const voteOnProposal = useCallback(async (proposalId, support) => {
    if (!contracts?.governanceModule) {
      throw new Error('GovernanceModule contract not initialized');
    }

    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      const isValidNetwork = await validateNetwork();
      if (!isValidNetwork) {
        throw new Error('Please switch to Polygon Amoy network');
      }

      // VoteType: 0 = Against, 1 = For, 2 = Abstain
      const voteType = support ? 1 : 0;
      
      const tx = await contracts.governanceModule.castVote(proposalId, voteType);
      const receipt = await tx.wait();

      toast({
        title: 'Vote Submitted!',
        description: `Voted ${support ? 'FOR' : 'AGAINST'} proposal ${proposalId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return { txHash: tx.hash, receipt };
    } catch (error) {
      console.error('Vote error:', error);
      
      let errorMessage = 'Failed to submit vote';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Vote Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contracts?.governanceModule, isConnected, validateNetwork, toast]);

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const getUSDCBalance = useCallback(async (address) => {
    if (!signer) return '0';

    try {
      const USDC_ADDRESS = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';
      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        ['function balanceOf(address) external view returns (uint256)'],
        signer
      );

      const balance = await usdcContract.balanceOf(address || account);
      return ethers.utils.formatUnits(balance, 6);
    } catch (error) {
      console.error('Get USDC balance error:', error);
      return '0';
    }
  }, [signer, account]);

  const convertBDTToUSDC = useCallback(async (bdtAmount) => {
    if (!contracts?.projectFactory) return '0';

    try {
      const scaledBDT = Math.floor(parseFloat(bdtAmount) * 100);
      const usdcAmount = await contracts.projectFactory.convertBDTToUSDC(scaledBDT);
      return ethers.utils.formatUnits(usdcAmount, 6);
    } catch (error) {
      console.error('Convert BDT to USDC error:', error);
      return '0';
    }
  }, [contracts?.projectFactory]);

  const convertUSDCToBDT = useCallback(async (usdcAmount) => {
    if (!contracts?.projectFactory) return '0';

    try {
      const amountUSDC = ethers.utils.parseUnits(usdcAmount.toString(), 6);
      const bdtAmount = await contracts.projectFactory.convertUSDCToBDT(amountUSDC);
      return (bdtAmount.toNumber() / 100).toString(); // Convert from scaled BDT
    } catch (error) {
      console.error('Convert USDC to BDT error:', error);
      return '0';
    }
  }, [contracts?.projectFactory]);

  // ==========================================
  // ROLES AND PERMISSIONS
  // ==========================================

  const checkUserRoles = useCallback(async () => {
    if (!contracts || !account) return { isFarmer: false, isInvestor: false, isValidator: false };

    try {
      const roles = {};
      
      if (contracts.projectFactory) {
        const FARMER_ROLE = await contracts.projectFactory.FARMER_ROLE();
        const VALIDATOR_ROLE = await contracts.projectFactory.VALIDATOR_ROLE();
        roles.isFarmer = await contracts.projectFactory.hasRole(FARMER_ROLE, account);
        roles.isValidator = await contracts.projectFactory.hasRole(VALIDATOR_ROLE, account);
      }
      
      if (contracts.investmentManager) {
        const INVESTOR_ROLE = await contracts.investmentManager.INVESTOR_ROLE();
        roles.isInvestor = await contracts.investmentManager.hasRole(INVESTOR_ROLE, account);
      }
      
      return roles;
    } catch (error) {
      console.error('Check user roles error:', error);
      return { isFarmer: false, isInvestor: false, isValidator: false };
    }
  }, [contracts, account]);

  return {
    loading,
    // Project functions
    createProject,
    getProject,
    getAllProjects,
    // Investment functions
    investInProject,
    getProjectFunding,
    getInvestorProjects,
    getInvestorProjectDetails,
    // Governance functions
    createProposal,
    voteOnProposal,
    // Utility functions
    getUSDCBalance,
    convertBDTToUSDC,
    convertUSDCToBDT,
    checkUserRoles,
    // Validation
    validateNetwork,
  };
};