import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { useToast } from '@chakra-ui/react';
import contractAddresses from '../contracts/amoy-addresses.json';

// Import contract ABIs and addresses
import ProjectFactoryABI from '../contracts/ProjectFactory.json';
import InvestmentManagerABI from '../contracts/InvestmentManager.json';
import IdentityRegistryABI from '../contracts/IdentityRegistry.json';
import OracleIntegrationABI from '../contracts/OracleIntegration.json';
import YieldDistributorABI from '../contracts/YieldDistributor.json';
import GovernanceModuleABI from '../contracts/GovernanceModule.json';

// Import the deployed addresses
const CONTRACT_ADDRESSES = {
  projectFactory: contractAddresses.projectFactory,
  investmentManager: contractAddresses.investmentManager,
  identityRegistry: contractAddresses.identityRegistry,
  oracleIntegration: contractAddresses.oracleIntegration,
  yieldDistributor: contractAddresses.yieldDistributor,
  governanceModule: contractAddresses.governanceModule
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
  
  // Use refs to track initialization state
  const isInitialized = useRef(false);
  const isCheckingConnection = useRef(false);
  
  const toast = useToast();

  // Memoize contract initialization to prevent recreation
  const initializeContracts = useCallback((signerInstance) => {
    if (!signerInstance) {
      console.warn('No signer provided to initializeContracts');
      return;
    }

    try {
      const newContracts = {};
      
      // Only initialize contracts if addresses are provided
      if (CONTRACT_ADDRESSES.projectFactory) {
        newContracts.projectFactory = new ethers.Contract(
          CONTRACT_ADDRESSES.projectFactory,
          ProjectFactoryABI,
          signerInstance
        );
      }

      if (CONTRACT_ADDRESSES.investmentManager) {
        newContracts.investmentManager = new ethers.Contract(
          CONTRACT_ADDRESSES.investmentManager,
          InvestmentManagerABI,
          signerInstance
        );
      }

      if (CONTRACT_ADDRESSES.identityRegistry) {
        newContracts.identityRegistry = new ethers.Contract(
          CONTRACT_ADDRESSES.identityRegistry,
          IdentityRegistryABI,
          signerInstance
        );
      }

      if (CONTRACT_ADDRESSES.oracleIntegration) {
        newContracts.oracleIntegration = new ethers.Contract(
          CONTRACT_ADDRESSES.oracleIntegration,
          OracleIntegrationABI,
          signerInstance
        );
      }

      if (CONTRACT_ADDRESSES.yieldDistributor) {
        newContracts.yieldDistributor = new ethers.Contract(
          CONTRACT_ADDRESSES.yieldDistributor,
          YieldDistributorABI,
          signerInstance
        );
      }

      if (CONTRACT_ADDRESSES.governanceModule) {
        newContracts.governanceModule = new ethers.Contract(
          CONTRACT_ADDRESSES.governanceModule,
          GovernanceModuleABI,
          signerInstance
        );
      }

      setContracts(newContracts);
      console.log('Contracts initialized successfully');
    } catch (error) {
      console.error('Error initializing contracts:', error);
      setContracts({});
    }
  }, []); // Empty dependency array since CONTRACT_ADDRESSES is static

  // Memoize wallet connection function
  const connectWallet = useCallback(async () => {
  if (isLoading) return;

  try {
    setIsLoading(true);

    const detectedProvider = await detectEthereumProvider();
    if (!detectedProvider) throw new Error('Please install MetaMask!');

    // Switch network
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Add network if it doesn’t exist
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x13882',
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://amoy.polygonscan.com'],
          }],
        });
      } else {
        throw switchError; // rethrow other errors
      }
    }

    // Request account access after network is ready
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) throw new Error('No accounts found');

    const ethersProvider = new ethers.providers.Web3Provider(detectedProvider);
    const ethersSigner = ethersProvider.getSigner();
    const network = await ethersProvider.getNetwork();

    setProvider(ethersProvider);
    setSigner(ethersSigner);
    setAccount(accounts[0]);
    setChainId(network.chainId.toString());
    setIsConnected(true);

    initializeContracts(ethersSigner);

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
}, [isLoading, initializeContracts, toast]);

  // Memoize disconnect function
  const disconnectWallet = useCallback(() => {
    setAccount('');
    setChainId('');
    setIsConnected(false);
    setContracts({});
    setProvider(null);
    setSigner(null);
    isInitialized.current = false;
    
    toast({
      title: 'Wallet Disconnected',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  // Set up event listeners only once
  useEffect(() => {
    if (!window.ethereum || isInitialized.current) return;

    const handleAccountsChanged = (accounts) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (newChainId) => {
      console.log('Chain changed to:', newChainId);
      setChainId(parseInt(newChainId, 16).toString());
      // Instead of reloading, just update the chain ID
      // Reload only if necessary for your specific use case
      // window.location.reload();
    };

    const handleConnect = (connectInfo) => {
      console.log('Wallet connected:', connectInfo);
    };

    const handleDisconnect = (error) => {
      console.log('Wallet disconnected:', error);
      disconnectWallet();
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('connect', handleConnect);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [disconnectWallet]); // Only depend on disconnectWallet which is memoized

  // Check wallet connection only once on mount
  // useEffect(() => {
  //   const checkWalletConnection = async () => {
  //     // Prevent multiple simultaneous checks
  //     if (isCheckingConnection.current || isInitialized.current) return;
      
  //     isCheckingConnection.current = true;
      
  //     try {
  //       const detectedProvider = await detectEthereumProvider();
        
  //       if (!detectedProvider) {
  //         console.log('No ethereum provider detected');
  //         return;
  //       }
        
  //       const accounts = await window.ethereum.request({ 
  //         method: 'eth_accounts' 
  //       });
        
  //       if (accounts && accounts.length > 0) {
  //         console.log('Found existing connection:', accounts[0]);
          
  //         const ethersProvider = new ethers.providers.Web3Provider(detectedProvider);
  //         const ethersSigner = ethersProvider.getSigner();
  //         const network = await ethersProvider.getNetwork();
          
  //         // Batch state updates
  //         setProvider(ethersProvider);
  //         setSigner(ethersSigner);
  //         setAccount(accounts[0]);
  //         setChainId(network.chainId.toString());
  //         setIsConnected(true);
          
  //         // Initialize contracts
  //         initializeContracts(ethersSigner);
          
  //         isInitialized.current = true;
  //       }
  //     } catch (error) {
  //       console.error('Error checking wallet connection:', error);
  //     } finally {
  //       isCheckingConnection.current = false;
  //     }
  //   };

  //   // Only run once on mount
  //   checkWalletConnection();
  // }, []); // Empty dependency array - only run once

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    account,
    chainId,
    isConnected,
    isLoading,
    contracts,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
  }), [
    account,
    chainId,
    isConnected,
    isLoading,
    contracts,
    provider,
    signer,
    connectWallet,
    disconnectWallet
  ]);

  return (
    <Web3Context.Provider value={contextValue}>
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