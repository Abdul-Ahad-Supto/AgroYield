// Create: frontend/src/hooks/useContracts.js

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useToast } from '@chakra-ui/react';

export const useContracts = () => {
  const { contracts, signer, validateNetwork, networkConfig } = useWeb3();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // ==========================================
  // PROJECT FACTORY FUNCTIONS
  // ==========================================

  const createProject = useCallback(async (projectData) => {
    if (!contracts.projectFactory) {
      throw new Error('ProjectFactory contract not initialized');
    }

    setLoading(true);
    try {
      // Validate network
      const isValidNetwork = await validateNetwork();
      if (!isValidNetwork) {
        throw new Error('Please switch to Polygon Amoy network');
      }

      // Convert BDT amount to scaled format (multiply by 100)
      const targetAmountBDT = Math.floor(parseFloat(projectData.targetAmount) * 100);
      
      // Calculate duration in days (default 90)
      const durationDays = projectData.duration || 90;

      const tx = await contracts.projectFactory.createProject(
        projectData.title,
        projectData.description,
        projectData.ipfsHash || 'QmDefault', // You'll need IPFS integration
        targetAmountBDT,
        durationDays,
        projectData.location,
        projectData.category
      );

      const receipt = await tx.wait();
      
      // Get the project ID from the event
      const projectCreatedEvent = receipt.events?.find(
        event => event.event === 'ProjectCreated'
      );
      const projectId = projectCreatedEvent?.args?.projectId;

      toast({
        title: 'Project Created Successfully!',
        description: `Project ID: ${projectId}. Transaction: ${tx.hash}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return { projectId, txHash: tx.hash, receipt };
    } catch (error) {
      console.error('Create project error:', error);
      toast({
        title: 'Project Creation Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contracts.projectFactory, validateNetwork, toast]);

  const getProject = useCallback(async (projectId) => {
    if (!contracts.projectFactory) return null;

    try {
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
  }, [contracts.projectFactory]);

  const getAllProjects = useCallback(async () => {
    if (!contracts.projectFactory) return [];

    try {
      const totalProjects = await contracts.projectFactory.getTotalProjects();
      const projects = [];

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
  }, [contracts.projectFactory, getProject]);

  // ==========================================
  // INVESTMENT MANAGER FUNCTIONS
  // ==========================================

  const investInProject = useCallback(async (projectId, usdcAmount) => {
    if (!contracts.investmentManager) {
      throw new Error('InvestmentManager contract not initialized');
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
      
      // First, approve USDC spending if needed
      const usdcContract = new ethers.Contract(
        networkConfig.usdcAddress,
        [
          'function approve(address,uint256) external returns (bool)',
          'function allowance(address,address) external view returns (uint256)',
          'function balanceOf(address) external view returns (uint256)'
        ],
        signer
      );

      // Check current allowance
      const currentAllowance = await usdcContract.allowance(
        signer.getAddress(), 
        contracts.investmentManager.address
      );

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
        await approveTx.wait();
      }

      // Now make the investment
      toast({
        title: 'Processing Investment...',
        description: 'Please confirm the investment transaction',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      const tx = await contracts.investmentManager.invest(projectId, amountUSDC);
      const receipt = await tx.wait();

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
      toast({
        title: 'Investment Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contracts.investmentManager, networkConfig.usdcAddress, signer, validateNetwork, toast]);

  const getProjectFunding = useCallback(async (projectId) => {
    if (!contracts.investmentManager) return { usdcAmount: '0', bdtAmount: '0' };

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
  }, [contracts.investmentManager]);

  // ==========================================
  // GOVERNANCE FUNCTIONS
  // ==========================================

  const createProposal = useCallback(async (title, description, ipfsHash = '') => {
    if (!contracts.governanceModule) {
      throw new Error('GovernanceModule contract not initialized');
    }

    setLoading(true);
    try {
      const tx = await contracts.governanceModule.propose(description, ipfsHash);
      const receipt = await tx.wait();
      
      const proposalCreatedEvent = receipt.events?.find(
        event => event.event === 'ProposalCreated'
      );
      const proposalId = proposalCreatedEvent?.args?.proposalId;

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
      toast({
        title: 'Proposal Creation Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contracts.governanceModule, toast]);

  const voteOnProposal = useCallback(async (proposalId, support) => {
    if (!contracts.governanceModule) {
      throw new Error('GovernanceModule contract not initialized');
    }

    setLoading(true);
    try {
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
      toast({
        title: 'Vote Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contracts.governanceModule, toast]);

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const getUSDCBalance = useCallback(async (address) => {
    if (!signer || !networkConfig.usdcAddress) return '0';

    try {
      const usdcContract = new ethers.Contract(
        networkConfig.usdcAddress,
        ['function balanceOf(address) external view returns (uint256)'],
        signer
      );

      const balance = await usdcContract.balanceOf(address);
      return ethers.utils.formatUnits(balance, 6);
    } catch (error) {
      console.error('Get USDC balance error:', error);
      return '0';
    }
  }, [signer, networkConfig.usdcAddress]);

  const convertBDTToUSDC = useCallback(async (bdtAmount) => {
    if (!contracts.projectFactory) return '0';

    try {
      const scaledBDT = Math.floor(parseFloat(bdtAmount) * 100);
      const usdcAmount = await contracts.projectFactory.convertBDTToUSDC(scaledBDT);
      return ethers.utils.formatUnits(usdcAmount, 6);
    } catch (error) {
      console.error('Convert BDT to USDC error:', error);
      return '0';
    }
  }, [contracts.projectFactory]);

  return {
    loading,
    // Project functions
    createProject,
    getProject,
    getAllProjects,
    // Investment functions
    investInProject,
    getProjectFunding,
    // Governance functions
    createProposal,
    voteOnProposal,
    // Utility functions
    getUSDCBalance,
    convertBDTToUSDC,
  };
};