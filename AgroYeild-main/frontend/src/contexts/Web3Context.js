import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { useToast } from '@chakra-ui/react';

// Import contract ABIs and addresses
import ProjectFactoryABI from '../contracts/ProjectFactory.json';
import InvestmentManagerABI from '../contracts/InvestmentManager.json';
import IdentityRegistryABI from '../contracts/IdentityRegistry.json';
import OracleIntegrationABI from '../contracts/OracleIntegration.json';
import YieldDistributorABI from '../contracts/YieldDistributor.json';
import GovernanceModuleABI from '../contracts/GovernanceModule.json';

// Contract addresses (replace with actual deployed addresses)
// Using empty strings to prevent errors when contracts aren't deployed yet
const CONTRACT_ADDRESSES = {
  projectFactory: '',
  investmentManager: '',
  identityRegistry: '',
  oracleIntegration: '',
  yieldDistributor: '',
  governanceModule: ''
};

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState({});
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  
  const toast = useToast();

  // Initialize Web3 connection
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      // Detect MetaMask provider
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('Please install MetaMask!');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();
      
      setProvider(ethersProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(network.chainId);
      setIsConnected(true);
      
      // Initialize contracts
      initializeContracts(provider, signer);
      
      toast({
        title: 'Wallet Connected',
        description: `Connected as ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize contract instances
  const initializeContracts = (signer) => {
    try {
      const contracts = {};
      
      // Only initialize contracts if addresses are provided
      if (CONTRACT_ADDRESSES.projectFactory) {
        contracts.projectFactory = new ethers.Contract(
          CONTRACT_ADDRESSES.projectFactory,
          ProjectFactoryABI,
          signer
        );
      }

      if (CONTRACT_ADDRESSES.investmentManager) {
        contracts.investmentManager = new ethers.Contract(
          CONTRACT_ADDRESSES.investmentManager,
          InvestmentManagerABI,
          signer
        );
      }

      if (CONTRACT_ADDRESSES.identityRegistry) {
        contracts.identityRegistry = new ethers.Contract(
          CONTRACT_ADDRESSES.identityRegistry,
          IdentityRegistryABI,
          signer
        );
      }

      if (CONTRACT_ADDRESSES.oracleIntegration) {
        contracts.oracleIntegration = new ethers.Contract(
          CONTRACT_ADDRESSES.oracleIntegration,
          OracleIntegrationABI,
          signer
        );
      }

      if (CONTRACT_ADDRESSES.yieldDistributor) {
        contracts.yieldDistributor = new ethers.Contract(
          CONTRACT_ADDRESSES.yieldDistributor,
          YieldDistributorABI,
          signer
        );
      }

      if (CONTRACT_ADDRESSES.governanceModule) {
        contracts.governanceModule = new ethers.Contract(
          CONTRACT_ADDRESSES.governanceModule,
          GovernanceModuleABI,
          signer
        );
      }

      setContracts(contracts);
    } catch (error) {
      console.error('Error initializing contracts:', error);
      // Set empty contracts to prevent errors
      setContracts({});
    }
  };

  // Handle account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      // Set up event listeners
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          // Handle account disconnect
          setAccount('');
          setIsConnected(false);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Check if wallet is already connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      const provider = await detectEthereumProvider();
      
      if (provider) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const ethersProvider = new ethers.providers.Web3Provider(provider);
          const signer = ethersProvider.getSigner();
          const network = await ethersProvider.getNetwork();
          
          setProvider(ethersProvider);
          setSigner(signer);
          setAccount(accounts[0]);
          setChainId(network.chainId);
          setIsConnected(true);
          initializeContracts(ethersProvider, signer);
        }
      }
    };

    checkWalletConnection();
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnected,
        isLoading,
        contracts,
        provider,
        signer,
        connectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export default Web3Context;
