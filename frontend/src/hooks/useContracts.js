// frontend/src/hooks/useContracts.js - FIXED VERSION - Fix Timing Issue
import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@chakra-ui/react';
import { useWeb3 } from '../contexts/Web3Context';

// Contract ABIs
import ProjectFactoryABI from '../contracts/ProjectFactory.json';
import InvestmentManagerABI from '../contracts/InvestmentManager.json';

// Contract addresses
const CONTRACT_ADDRESSES = {
  projectFactory: process.env.REACT_APP_PROJECT_FACTORY,
  investmentManager: process.env.REACT_APP_INVESTMENT_MANAGER,
  usdc: process.env.REACT_APP_USDC_ADDRESS
};

export const useContracts = () => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [contracts, setContracts] = useState({});
  const [contractsReady, setContractsReady] = useState(false); // ADDED: Ready state
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Refs to prevent multiple initializations
  const initializingRef = useRef(false);
  const lastProviderRef = useRef(null);
  const lastSignerRef = useRef(null);

  // FIXED: Contract initialization with proper ready state
  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (initializingRef.current) {
      console.log('⏭️ Skipping contract init - already initializing');
      return;
    }

    // Only reinitialize if provider/signer actually changed
    if (lastProviderRef.current === provider && lastSignerRef.current === signer) {
      console.log('⏭️ Skipping contract init - same provider/signer');
      return;
    }

    if (provider && signer && CONTRACT_ADDRESSES.projectFactory) {
      initializingRef.current = true;
      setContractsReady(false); // ADDED: Set not ready during init
      
      try {
        console.log('🔧 Initializing contracts...');
        
        const projectFactory = new ethers.Contract(
          CONTRACT_ADDRESSES.projectFactory,
          ProjectFactoryABI,
          signer
        );

        const investmentManager = new ethers.Contract(
          CONTRACT_ADDRESSES.investmentManager,
          InvestmentManagerABI,
          signer
        );

        const usdc = new ethers.Contract(
          CONTRACT_ADDRESSES.usdc,
          [
            'function balanceOf(address) view returns (uint256)',
            'function transfer(address, uint256) returns (bool)',
            'function transferFrom(address, address, uint256) returns (bool)',
            'function approve(address, uint256) returns (bool)',
            'function allowance(address, address) view returns (uint256)',
            'function decimals() view returns (uint8)'
          ],
          signer
        );

        const newContracts = {
          projectFactory,
          investmentManager,
          usdc
        };

        setContracts(newContracts);

        // Update refs to prevent unnecessary reinitializations
        lastProviderRef.current = provider;
        lastSignerRef.current = signer;

        // ADDED: Small delay to ensure contracts are fully ready
        setTimeout(() => {
          setContractsReady(true);
          console.log('✅ Contracts initialized and ready');
        }, 100);
        
      } catch (error) {
        console.error('❌ Error initializing contracts:', error);
        setContractsReady(false);
        toast({
          title: 'Contract Initialization Failed',
          description: 'Please check your network connection and try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        initializingRef.current = false;
      }
    } else {
      // Clear contracts if no provider/signer
      setContracts({});
      setContractsReady(false);
      lastProviderRef.current = null;
      lastSignerRef.current = null;
    }
  }, [provider, signer, toast]);

  // User Registration - FIXED: Check contracts ready
  const registerUser = useCallback(async (name, profileIPFSHash = '') => {
    if (!contractsReady || !contracts.projectFactory || !isConnected) {
      throw new Error('Wallet not connected or contracts not ready');
    }

    try {
      setLoading(true);
      
      const tx = await contracts.projectFactory.registerUser(name, profileIPFSHash);
      const receipt = await tx.wait();
      
      toast({
        title: 'Registration Successful',
        description: `Welcome to AgroYield, ${name}!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      return { tx, receipt };
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.reason || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contractsReady, contracts.projectFactory, isConnected, toast]);

  // FIXED: Check contracts ready state
  const isUserRegistered = useCallback(async (address = account) => {
    if (!contractsReady || !contracts.projectFactory || !address) {
      console.log('Contracts not ready for registration check');
      return false;
    }
    
    try {
      return await contracts.projectFactory.isUserRegistered(address);
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  }, [contractsReady, contracts.projectFactory, account]);

  const getUserProfile = useCallback(async (address = account) => {
    if (!contractsReady || !contracts.projectFactory || !address) {
      return null;
    }
    
    try {
      const profile = await contracts.projectFactory.getUserProfile(address);
      return {
        isRegistered: profile.isRegistered,
        name: profile.name,
        profileIPFSHash: profile.profileIPFSHash,
        registeredAt: profile.registeredAt.toString(),
        projectCount: profile.projectCount.toString(),
        totalInvested: profile.totalInvested.toString(),
        totalRaised: profile.totalRaised.toString()
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }, [contractsReady, contracts.projectFactory, account]);

  // Create Project - FIXED: Check contracts ready
  const createProject = useCallback(async (projectData) => {
    if (!contractsReady || !contracts.projectFactory || !isConnected) {
      throw new Error('Wallet not connected or contracts not ready');
    }

    try {
      setLoading(true);
      
      const {
        title,
        description,
        imageIPFSHash,
        documentsIPFSHash = '',
        targetAmountUSDC,
        durationDays,
        location,
        category
      } = projectData;

      // Convert USDC amount to proper format (6 decimals)
      const targetAmount = ethers.utils.parseUnits(targetAmountUSDC.toString(), 6);
      
      const tx = await contracts.projectFactory.createProject(
        title,
        description,
        imageIPFSHash,
        documentsIPFSHash,
        targetAmount,
        parseInt(durationDays),
        location,
        category
      );
      
      const receipt = await tx.wait();
      
      // Get project ID from event
      const event = receipt.events?.find(e => e.event === 'ProjectCreated');
      const projectId = event?.args?.projectId?.toString();
      
      // Clear cache since we added a new project
      clearProjectCache();
      
      toast({
        title: 'Project Created Successfully',
        description: `Project ID: ${projectId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      return { tx, receipt, projectId };
      
    } catch (error) {
      console.error('Create project error:', error);
      toast({
        title: 'Project Creation Failed',
        description: error.reason || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contractsReady, contracts.projectFactory, isConnected, toast]);

  // FIXED: Cached functions with contracts ready check
  const projectsCacheRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

  const getAllProjects = useCallback(async () => {
    if (!contractsReady || !contracts.projectFactory) {
      console.log('⏳ Contracts not ready for getAllProjects');
      return [];
    }
    
    // Use cache if recent
    const now = Date.now();
    if (projectsCacheRef.current && (now - lastFetchTimeRef.current) < CACHE_DURATION) {
      console.log('📋 Using cached projects data');
      return projectsCacheRef.current;
    }
    
    try {
      console.log('🔍 Fetching fresh projects from blockchain...');
      const projects = await contracts.projectFactory.getAllProjects();
      
      const processedProjects = projects.map(project => ({
        id: project.id.toString(),
        farmer: project.farmer,
        title: project.title,
        description: project.description,
        imageIPFSHash: project.imageIPFSHash,
        documentsIPFSHash: project.documentsIPFSHash,
        targetAmountUSDC: ethers.utils.formatUnits(project.targetAmountUSDC, 6),
        currentAmountUSDC: ethers.utils.formatUnits(project.currentAmountUSDC, 6),
        durationDays: project.durationDays.toString(),
        createdAt: project.createdAt.toString(),
        deadline: project.deadline.toString(),
        status: project.status,
        location: project.location,
        category: project.category,
        investorCount: project.investorCount.toString(),
        fundsReleased: project.fundsReleased
      }));

      // Cache the results
      projectsCacheRef.current = processedProjects;
      lastFetchTimeRef.current = now;
      
      console.log('✅ Projects loaded and cached:', processedProjects.length);
      return processedProjects;
      
    } catch (error) {
      console.error('❌ Error getting projects:', error);
      // Return cached data if available, otherwise empty array
      return projectsCacheRef.current || [];
    }
  }, [contractsReady, contracts.projectFactory]);

  // FIXED: Single project fetch with contracts ready check
  const projectCacheRef = useRef(new Map());

  const getProject = useCallback(async (projectId) => {
    if (!contractsReady || !contracts.projectFactory || !projectId) {
      console.log('⏳ Contracts not ready or no project ID provided');
      return null;
    }
    
    // Check cache first
    const cacheKey = `project_${projectId}`;
    if (projectCacheRef.current.has(cacheKey)) {
      const cached = projectCacheRef.current.get(cacheKey);
      // Use cache if less than 60 seconds old
      if (Date.now() - cached.timestamp < 60000) {
        console.log('📋 Using cached project data for ID:', projectId);
        return cached.data;
      }
    }
    
    try {
      console.log('🔍 Fetching project from blockchain:', projectId);
      const project = await contracts.projectFactory.getProject(projectId);
      
      if (!project || project.id.toString() === '0') {
        console.warn('❌ Project not found:', projectId);
        return null;
      }
      
      const processedProject = {
        id: project.id.toString(),
        farmer: project.farmer,
        title: project.title,
        description: project.description,
        imageIPFSHash: project.imageIPFSHash,
        documentsIPFSHash: project.documentsIPFSHash,
        targetAmountUSDC: ethers.utils.formatUnits(project.targetAmountUSDC, 6),
        currentAmountUSDC: ethers.utils.formatUnits(project.currentAmountUSDC, 6),
        durationDays: project.durationDays.toString(),
        createdAt: project.createdAt.toString(),
        deadline: project.deadline.toString(),
        status: project.status,
        location: project.location,
        category: project.category,
        investorCount: project.investorCount.toString(),
        fundsReleased: project.fundsReleased
      };

      // Cache the result
      projectCacheRef.current.set(cacheKey, {
        data: processedProject,
        timestamp: Date.now()
      });
      
      console.log('✅ Project loaded and cached:', processedProject.id);
      return processedProject;
      
    } catch (error) {
      console.error('❌ Error getting project:', error);
      return null;
    }
  }, [contractsReady, contracts.projectFactory]);

  // Clear project cache when needed
  const clearProjectCache = useCallback((projectId) => {
    if (projectId) {
      projectCacheRef.current.delete(`project_${projectId}`);
    } else {
      projectCacheRef.current.clear();
      projectsCacheRef.current = null;
    }
  }, []);

  // FIXED: Investment with contracts ready check
  const investInProject = useCallback(async (projectId, amountUSDC) => {
    if (!contractsReady || !contracts.investmentManager || !contracts.usdc || !isConnected) {
      throw new Error('Wallet not connected or contracts not ready');
    }

    try {
      setLoading(true);
      
      const amount = ethers.utils.parseUnits(amountUSDC.toString(), 6);
      
      // Check USDC balance
      const balance = await contracts.usdc.balanceOf(account);
      if (balance.lt(amount)) {
        throw new Error('Insufficient USDC balance');
      }
      
      // Check allowance
      const allowance = await contracts.usdc.allowance(account, CONTRACT_ADDRESSES.investmentManager);
      if (allowance.lt(amount)) {
        // Approve USDC spending
        const approveTx = await contracts.usdc.approve(CONTRACT_ADDRESSES.investmentManager, amount);
        await approveTx.wait();
        
        toast({
          title: 'USDC Approved',
          description: 'USDC spending approved for investment',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Make investment
      const tx = await contracts.investmentManager.investInProject(projectId, amount);
      const receipt = await tx.wait();
      
      // Clear cache for this project since it was updated
      clearProjectCache(projectId);
      
      toast({
        title: 'Investment Successful',
        description: `Invested ${amountUSDC} USDC in project ${projectId}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      return { tx, receipt };
      
    } catch (error) {
      console.error('Investment error:', error);
      toast({
        title: 'Investment Failed',
        description: error.reason || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contractsReady, contracts.investmentManager, contracts.usdc, isConnected, account, toast, clearProjectCache]);

  // FIXED: Other functions with contracts ready check
  const getUSDCBalance = useCallback(async (address = account) => {
    if (!contractsReady || !contracts.usdc || !address) return '0';
    
    try {
      const balance = await contracts.usdc.balanceOf(address);
      return ethers.utils.formatUnits(balance, 6);
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return '0';
    }
  }, [contractsReady, contracts.usdc, account]);

  const getPlatformStats = useCallback(async () => {
    if (!contractsReady || !contracts.projectFactory) return null;
    
    try {
      const stats = await contracts.projectFactory.getPlatformStats();
      
      return {
        totalProjects: stats.totalProjects.toString(),
        totalUsers: stats.totalUsers.toString(),
        totalInvestments: stats.totalInvestments.toString(),
        totalFunding: ethers.utils.formatUnits(stats.totalFunding, 6)
      };
      
    } catch (error) {
      console.error('Error getting platform stats:', error);
      return null;
    }
  }, [contractsReady, contracts.projectFactory]);

  const getInvestorData = useCallback(async (address = account) => {
    if (!contractsReady || !contracts.investmentManager || !address) return null;
    
    try {
      const data = await contracts.investmentManager.getInvestorData(address);
      
      return {
        totalInvested: ethers.utils.formatUnits(data.totalInvested, 6),
        activeInvestments: data.activeInvestments.toString(),
        claimedReturns: ethers.utils.formatUnits(data.claimedReturns, 6),
        pendingAmount: ethers.utils.formatUnits(data.pendingAmount, 6),
        projectIds: data.projectIds.map(id => id.toString())
      };
      
    } catch (error) {
      console.error('Error getting investor data:', error);
      return null;
    }
  }, [contractsReady, contracts.investmentManager, account]);

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      projectCacheRef.current.clear();
      projectsCacheRef.current = null;
    };
  }, []);

  return {
    contracts,
    contractsReady, // ADDED: Expose ready state
    loading,
    
    // User functions
    registerUser,
    isUserRegistered,
    getUserProfile,
    
    // Project functions
    createProject,
    getAllProjects,
    getProject,
    clearProjectCache,
    
    // Investment functions
    investInProject,
    getUSDCBalance,
    getInvestorData,
    
    // Platform functions
    getPlatformStats,
    
    // Contract addresses for reference
    addresses: CONTRACT_ADDRESSES
  };
};