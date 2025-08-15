// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const toast = useToast();

  // Connect to MetaMask wallet
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        
        toast({
          title: 'Wallet Connected',
          description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        return accounts[0];
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [toast]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletAddress('');
    setIsConnected(false);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    
    toast({
      title: 'Wallet Disconnected',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  // Register user
  const register = useCallback(async (walletAddress, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token and update state
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      toast({
        title: 'Registration Successful',
        description: 'Welcome to AgroYield!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [toast]);

  // Login user
  const login = useCallback(async (walletAddress, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and update state
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.user.profile?.name || 'User'}!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return data;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [toast]);

  // Logout user
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    disconnectWallet();
    
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [disconnectWallet, toast]);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        setWalletAddress(userData.walletAddress);
        setIsConnected(true);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Submit KYC
  const submitKYC = useCallback(async (kycData, files) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      
      // Add text data
      Object.keys(kycData).forEach(key => {
        formData.append(key, kycData[key]);
      });

      // Add files
      if (files.nidFront) formData.append('nidFront', files.nidFront);
      if (files.nidBack) formData.append('nidBack', files.nidBack);
      if (files.selfie) formData.append('selfie', files.selfie);

      const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'KYC submission failed');
      }

      toast({
        title: 'KYC Submitted',
        description: 'Your KYC documents have been submitted for review',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return data;
    } catch (error) {
      console.error('KYC submission error:', error);
      toast({
        title: 'KYC Submission Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [toast]);

  // Get KYC status
  const getKYCStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/kyc/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get KYC status');
      }

      return data;
    } catch (error) {
      console.error('KYC status error:', error);
      throw error;
    }
  }, []);

  // Create project
  const createProject = useCallback(async (projectData, imageFile) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      
      // Add text data
      Object.keys(projectData).forEach(key => {
        formData.append(key, projectData[key]);
      });

      // Add image file
      if (imageFile) {
        formData.append('projectImage', imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/projects/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Project creation failed');
      }

      toast({
        title: 'Project Created',
        description: 'Your project has been submitted for review',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return data;
    } catch (error) {
      console.error('Project creation error:', error);
      toast({
        title: 'Project Creation Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [toast]);

  // Invest in project
  const investInProject = useCallback(async (projectId, amount) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/investments/invest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Investment failed');
      }

      toast({
        title: 'Investment Successful',
        description: `Successfully invested ${amount} in the project`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return data;
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
    }
  }, [toast]);

  // Get user stats
  const getUserStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/user/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user stats');
      }

      return data;
    } catch (error) {
      console.error('User stats error:', error);
      throw error;
    }
  }, []);

  // Get user investments
  const getUserInvestments = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/investments/my-investments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get investments');
      }

      return data;
    } catch (error) {
      console.error('User investments error:', error);
      throw error;
    }
  }, []);

  // API helper function
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for wallet changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== walletAddress) {
          setWalletAddress(accounts[0]);
          // If user is authenticated but wallet changed, logout
          if (isAuthenticated) {
            logout();
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [walletAddress, isAuthenticated, disconnectWallet, logout]);

  const contextValue = {
    // State
    user,
    isAuthenticated,
    isLoading,
    walletAddress,
    isConnected,
    
    // Auth methods
    connectWallet,
    disconnectWallet,
    register,
    login,
    logout,
    
    // KYC methods
    submitKYC,
    getKYCStatus,
    
    // Project methods
    createProject,
    investInProject,
    
    // User data methods
    getUserStats,
    getUserInvestments,
    
    // Utility
    apiCall
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;