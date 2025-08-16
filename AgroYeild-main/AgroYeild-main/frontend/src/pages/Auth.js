import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Divider,
  useToast,
  Icon,
  Badge,
  Switch
} from '@chakra-ui/react';
import { 
  FaWallet, 
  FaUser, 
  FaEmail, 
  FaEnvelope,
  FaLock, 
  FaUserTie,
  FaSeedling,
  FaMoneyBillWave,
  FaShieldAlt
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'investor'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const { 
    login, 
    register, 
    connectWallet, 
    isAuthenticated, 
    user 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    }
  }, [isAuthenticated, navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation (only for registration)
    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.role) {
        newErrors.role = 'Please select your role';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnectWallet = async () => {
    try {
      const address = await connectWallet();
      setWalletConnected(true);
      setWalletAddress(address);
      
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${address.substring(0, 6)}...${address.substring(38)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!walletConnected) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet first',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(walletAddress, formData.password);
      } else {
        await register(walletAddress, formData.email, formData.password, formData.role);
      }
      
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'farmer': return FaSeedling;
      case 'investor': return FaMoneyBillWave;
      case 'admin': return FaShieldAlt;
      default: return FaUser;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'farmer': return 'green';
      case 'investor': return 'blue';
      case 'admin': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="md">
        <VStack spacing={8}>
          {/* Header */}
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={2} bgGradient="linear(to-r, brand.500, brand.600)" bgClip="text">
              Welcome to AgroYield
            </Heading>
            <Text color="gray.600">
              {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
            </Text>
          </Box>

          {/* Auth Card */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} w="full" maxW="md">
            <CardHeader textAlign="center">
              <Tabs variant="soft-rounded" colorScheme="brand" onChange={(index) => setIsLogin(index === 0)}>
                <TabList>
                  <Tab flex={1}>Sign In</Tab>
                  <Tab flex={1}>Sign Up</Tab>
                </TabList>
              </Tabs>
            </CardHeader>

            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  {/* Wallet Connection */}
                  <Box w="full">
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Step 1: Connect Wallet</Text>
                    {walletConnected ? (
                      <Box p={3} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                        <HStack justify="space-between">
                          <HStack>
                            <Icon as={FaWallet} color="green.500" />
                            <Text fontSize="sm" fontWeight="medium">Wallet Connected</Text>
                          </HStack>
                          <Badge colorScheme="green">Connected</Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.600" mt={1} fontFamily="mono">
                          {walletAddress}
                        </Text>
                      </Box>
                    ) : (
                      <Button
                        leftIcon={<FaWallet />}
                        colorScheme="brand"
                        variant="outline"
                        size="lg"
                        w="full"
                        onClick={handleConnectWallet}
                      >
                        Connect MetaMask Wallet
                      </Button>
                    )}
                  </Box>

                  <Divider />

                  <Text fontSize="sm" fontWeight="medium" alignSelf="flex-start">
                    Step 2: {isLogin ? 'Login Details' : 'Account Details'}
                  </Text>

                  {/* Email */}
                  <FormControl isInvalid={errors.email}>
                    <FormLabel>
                      <HStack>
                        <Icon as={ FaEnvelope } />
                        <Text>Email Address</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>

                  {/* Role Selection (Registration only) */}
                  {!isLogin && (
                    <FormControl isInvalid={errors.role}>
                      <FormLabel>
                        <HStack>
                          <Icon as={FaUserTie} />
                          <Text>I want to be a:</Text>
                        </HStack>
                      </FormLabel>
                      <VStack spacing={3} align="stretch">
                        {[
                          { value: 'farmer', label: 'Farmer', description: 'Create and manage agricultural projects' },
                          { value: 'investor', label: 'Investor', description: 'Invest in farming projects and earn returns' }
                        ].map((role) => {
                          const IconComponent = getRoleIcon(role.value);
                          const isSelected = formData.role === role.value;
                          
                          return (
                            <Box
                              key={role.value}
                              p={4}
                              borderWidth="2px"
                              borderColor={isSelected ? `${getRoleColor(role.value)}.500` : borderColor}
                              borderRadius="md"
                              cursor="pointer"
                              bg={isSelected ? `${getRoleColor(role.value)}.50` : 'transparent'}
                              onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                              _hover={{ borderColor: `${getRoleColor(role.value)}.500` }}
                            >
                              <HStack>
                                <Icon as={IconComponent} color={`${getRoleColor(role.value)}.500`} boxSize={5} />
                                <Box>
                                  <Text fontWeight="bold">{role.label}</Text>
                                  <Text fontSize="sm" color="gray.600">{role.description}</Text>
                                </Box>
                              </HStack>
                            </Box>
                          );
                        })}
                      </VStack>
                      <FormErrorMessage>{errors.role}</FormErrorMessage>
                    </FormControl>
                  )}

                  {/* Password */}
                  <FormControl isInvalid={errors.password}>
                    <FormLabel>
                      <HStack>
                        <Icon as={FaLock} />
                        <Text>Password</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                    />
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>

                  {/* Confirm Password (Registration only) */}
                  {!isLogin && (
                    <FormControl isInvalid={errors.confirmPassword}>
                      <FormLabel>
                        <HStack>
                          <Icon as={FaLock} />
                          <Text>Confirm Password</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                      />
                      <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                    </FormControl>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    loadingText={isLogin ? 'Signing In...' : 'Creating Account...'}
                    isDisabled={!walletConnected}
                  >
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Button>

                  {/* Toggle Mode */}
                  <Text fontSize="sm" textAlign="center">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <Button
                      variant="link"
                      colorScheme="brand"
                      fontSize="sm"
                      onClick={() => setIsLogin(!isLogin)}
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </Button>
                  </Text>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {/* Info Card */}
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertTitle>Need Help?</AlertTitle>
              <AlertDescription fontSize="sm">
                Make sure you have MetaMask installed and set to Polygon Amoy testnet. 
                You'll need some MATIC and USDC for transactions.
              </AlertDescription>
            </Box>
          </Alert>
        </VStack>
      </Container>
    </Box>
  );
};

export default Auth;