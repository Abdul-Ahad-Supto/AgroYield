// frontend/src/pages/ProjectDetail.js - FIXED VERSION - Stop Infinite Loops
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  Stack, 
  SimpleGrid, 
  Divider, 
  Badge,
  Progress,
  VStack,
  HStack,
  useColorModeValue,
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Card,
  CardBody,
  Avatar,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center
} from '@chakra-ui/react';
import { 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaClock, 
  FaUsers, 
  FaArrowLeft,
  FaUser
} from 'react-icons/fa';
import { useWeb3 } from '../contexts/Web3Context';
import { useContracts } from '../hooks/useContracts';
import CORSSafeImage from '../components/CORSSafeImage';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Web3 and contract hooks
  const { isConnected, account } = useWeb3();
  const { getProject, investInProject, getUSDCBalance, contractsReady } = useContracts();
  
  // Component state
  const [project, setProject] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInvesting, setIsInvesting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  // Prevent multiple fetches
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastFetchedIdRef = useRef(null);
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  // FIXED: Stable project fetch function
  const fetchProjectData = useCallback(async (projectId) => {
    // Prevent multiple fetches for the same project
    if (fetchingRef.current || !projectId || !getProject) {
      console.log('⏭️ Skipping project fetch - already fetching or not ready');
      return;
    }

    // Don't refetch the same project
    if (lastFetchedIdRef.current === projectId && project) {
      console.log('⏭️ Project already loaded:', projectId);
      setIsLoading(false);
      return;
    }

    fetchingRef.current = true;
    setFetchError(null);
    
    try {
      console.log('🔍 Fetching project:', projectId);
      
      const projectData = await getProject(projectId);
      
      if (!mountedRef.current) return;
      
      if (!projectData || projectData.id === '0' || projectData.id === 0) {
        console.error('❌ Project not found:', projectId);
        setFetchError('Project not found - invalid project ID');
        return;
      }
      
      console.log('✅ Project data loaded:', projectData);
      setProject(projectData);
      setFetchError(null);
      lastFetchedIdRef.current = projectId;
      
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      if (mountedRef.current) {
        setFetchError(`Failed to load project: ${error.message}`);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [getProject, project]); // Include project to avoid unnecessary refetches

  // FIXED: Stable balance fetch
  const fetchBalance = useCallback(async () => {
    if (!isConnected || !account || !getUSDCBalance) return;
    
    try {
      const balance = await getUSDCBalance(account);
      if (mountedRef.current) {
        setUsdcBalance(balance);
      }
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      if (mountedRef.current) {
        setUsdcBalance('0');
      }
    }
  }, [isConnected, account, getUSDCBalance]);

  // FIXED: Single effect for project data
  useEffect(() => {
    mountedRef.current = true;
    
    if (id && contractsReady && getProject) {
      setIsLoading(true);
      fetchProjectData(id);
    } else if (!id) {
      setFetchError('No project ID provided');
      setIsLoading(false);
    } else if (!contractsReady) {
      console.log('⏳ Waiting for contracts to be ready...');
    }

    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
    };
  }, [id, contractsReady]); // Added contractsReady dependency

  // FIXED: Separate effect for balance
  useEffect(() => {
    if (isConnected && account && contractsReady && getUSDCBalance) {
      fetchBalance();
    }
  }, [isConnected, account, contractsReady]); // Added contractsReady

  // FIXED: Stable investment handler
  const handleInvest = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to invest.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid investment amount.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (parseFloat(investmentAmount) < 10) {
      toast({
        title: 'Minimum Investment',
        description: 'Minimum investment amount is 10 USDC.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (parseFloat(investmentAmount) > parseFloat(usdcBalance)) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough USDC balance.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsInvesting(true);
    try {
      await investInProject(id, investmentAmount);
      
      // Refresh project data after successful investment
      await fetchProjectData(id);
      
      // Refresh balance
      await fetchBalance();
      
      // Close modal and reset amount
      onClose();
      setInvestmentAmount('');
      
    } catch (error) {
      console.error('Investment failed:', error);
    } finally {
      setIsInvesting(false);
    }
  }, [
    isConnected, 
    investmentAmount, 
    usdcBalance, 
    id, 
    investInProject, 
    fetchProjectData, 
    fetchBalance, 
    onClose, 
    toast
  ]);

  // Memoized calculations to prevent re-renders
  const projectMetrics = useMemo(() => {
    if (!project) return null;

    const fundingProgress = project.targetAmountUSDC > 0 
      ? (parseFloat(project.currentAmountUSDC) / parseFloat(project.targetAmountUSDC)) * 100 
      : 0;

    const daysLeft = project.deadline ? 
      Math.max(0, Math.floor((new Date(parseInt(project.deadline) * 1000) - new Date()) / (1000 * 60 * 60 * 24))) 
      : 'N/A';

    return {
      fundingProgress: Math.min(fundingProgress, 100),
      daysLeft,
      currentAmount: parseFloat(project.currentAmountUSDC || '0'),
      targetAmount: parseFloat(project.targetAmountUSDC || '0'),
      investorCount: project.investorCount || '0'
    };
  }, [project]);

  // Loading state
  if (isLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="center" py={20}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text>Loading project details...</Text>
          <Text fontSize="sm" color="gray.500">Project ID: {id}</Text>
        </VStack>
      </Container>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} py={20}>
          <Alert status="error" borderRadius="lg" maxW="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Project Not Found!</AlertTitle>
              <AlertDescription>
                {fetchError}
              </AlertDescription>
            </Box>
          </Alert>
          
          <VStack spacing={2}>
            <Text fontSize="sm" color="gray.500">Project ID: {id}</Text>
            <Text fontSize="sm" color="gray.500">
              The project might not exist or there might be a network issue.
            </Text>
          </VStack>
          
          <HStack spacing={4}>
            <Button 
              leftIcon={<FaArrowLeft />} 
              onClick={() => navigate('/projects')}
              colorScheme="brand"
            >
              Back to Projects
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setFetchError(null);
                setIsLoading(true);
                fetchProjectData(id);
              }}
            >
              Retry
            </Button>
          </HStack>
        </VStack>
      </Container>
    );
  }

  // No project data
  if (!project) {
    return (
      <Container maxW="7xl" py={8}>
        <Center py={20}>
          <VStack spacing={4}>
            <Text fontSize="xl">No project data available</Text>
            <Button onClick={() => navigate('/projects')} colorScheme="brand">
              Back to Projects
            </Button>
          </VStack>
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" py={8}>
      <Stack spacing={8}>
        {/* Back Button */}
        <Button 
          leftIcon={<FaArrowLeft />} 
          variant="ghost" 
          size="sm" 
          alignSelf="flex-start"
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>

        {/* Project Header */}
        <Box>
          <Badge colorScheme="green" mb={2} px={3} py={1} borderRadius="full">
            {project.category}
          </Badge>
          <Heading as="h1" size="2xl" mb={4}>
            {project.title}
          </Heading>
          <Text fontSize="lg" color={secondaryTextColor} maxW="3xl">
            {project.description}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
          {/* Main Content */}
          <Box gridColumn={{ base: '1', lg: '1 / span 2' }}>
            {/* Project Image - FIXED: No loading prop to prevent loops */}
            <Box 
              borderRadius="lg"
              overflow="hidden"
              mb={6}
              height={{ base: '300px', md: '400px' }}
            >
              <CORSSafeImage
                ipfsHash={project.imageIPFSHash}
                category={project.category}
                alt={project.title}
                width="100%"
                height="100%"
                objectFit="cover"
              />
            </Box>

            <Tabs variant="enclosed" colorScheme="brand">
              <TabList>
                <Tab>Project Details</Tab>
                <Tab>Farmer Info</Tab>
              </TabList>

              <TabPanels py={6}>
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4}>Project Description</Heading>
                      <Text>{project.description}</Text>
                    </Box>
                    
                    <Box>
                      <Heading size="md" mb={4}>Project Details</Heading>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">Duration:</Text>
                          <Text fontSize="sm">{project.durationDays} days</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">Created:</Text>
                          <Text fontSize="sm">
                            {project.createdAt ? new Date(parseInt(project.createdAt) * 1000).toLocaleDateString() : 'N/A'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">Deadline:</Text>
                          <Text fontSize="sm">
                            {project.deadline ? new Date(parseInt(project.deadline) * 1000).toLocaleDateString() : 'N/A'}
                          </Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">Status:</Text>
                          <Badge colorScheme="green">
                            {project.status === 0 ? 'Active' : project.status === 1 ? 'Completed' : 'Cancelled'}
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>
                
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Card>
                      <CardBody>
                        <HStack spacing={4} mb={4}>
                          <Avatar
                            size="lg"
                            name="Project Farmer"
                          />
                          <Box>
                            <Text fontWeight="bold" fontSize="lg">Project Farmer</Text>
                            <Text fontSize="sm" color="gray.500" fontFamily="mono">
                              {project.farmer}
                            </Text>
                            <Badge colorScheme="green" mt={1}>Verified Farmer</Badge>
                          </Box>
                        </HStack>
                        <Text mb={4} color={textColor}>
                          Registered farmer on the AgroYield platform.
                        </Text>
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Location:</Text>
                            <Text fontSize="sm">{project.location}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Category:</Text>
                            <Text fontSize="sm">{project.category}</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>

          {/* Sidebar */}
          <Box>
            <Box 
              bg={cardBg} 
              p={6} 
              borderRadius="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
              position="sticky"
              top="6rem"
            >
              <VStack spacing={6} align="stretch">
                {projectMetrics && (
                  <>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>
                        Raised of {projectMetrics.targetAmount.toLocaleString()} USDC goal
                      </Text>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Text fontSize="2xl" fontWeight="bold" mr={2}>
                          {projectMetrics.currentAmount.toFixed(2)} USDC
                        </Text>
                        <Text color="green.500" fontWeight="medium">
                          {Math.round(projectMetrics.fundingProgress)}%
                        </Text>
                      </Box>
                      <Progress 
                        value={projectMetrics.fundingProgress} 
                        colorScheme="green" 
                        size="sm" 
                        borderRadius="full" 
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.500">Backers</Text>
                        <Text fontWeight="bold">{projectMetrics.investorCount}</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.500">Days Left</Text>
                        <Text fontWeight="bold">{projectMetrics.daysLeft}</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.500">Status</Text>
                        <Badge colorScheme={project.status === 0 ? 'green' : 'blue'}>
                          {project.status === 0 ? 'Active' : 'Funding'}
                        </Badge>
                      </Box>
                    </Box>
                  </>
                )}
                
                {isConnected && (
                  <Box p={3} bg="gray.50" borderRadius="md">
                    <Text fontSize="sm" color="gray.600" mb={1}>Your USDC Balance:</Text>
                    <Text fontWeight="bold">{parseFloat(usdcBalance).toFixed(2)} USDC</Text>
                  </Box>
                )}
                
                <Button 
                  colorScheme="brand" 
                  size="lg" 
                  width="full"
                  leftIcon={<FaMoneyBillWave />}
                  mb={2}
                  onClick={onOpen}
                  isDisabled={!isConnected || project.status !== 0}
                >
                  {!isConnected ? 'Connect Wallet to Invest' : 'Invest Now'}
                </Button>
                
                <Divider my={2} />
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Project Location</Text>
                  <HStack color="gray.500">
                    <FaMapMarkerAlt />
                    <Text>{project.location}</Text>
                  </HStack>
                </Box>
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Project ID</Text>
                  <Text fontFamily="mono" color="gray.500">#{project.id}</Text>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>Expected Return</Text>
                  <Text color="green.500" fontWeight="bold">12% annually</Text>
                  <Text fontSize="xs" color="gray.500">Platform estimated return</Text>
                </Box>
              </VStack>
            </Box>
          </Box>
        </SimpleGrid>
      </Stack>

      {/* Investment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invest in {project?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" color="gray.500" mb={2}>Your USDC Balance</Text>
                <Text fontSize="lg" fontWeight="bold">{parseFloat(usdcBalance).toFixed(2)} USDC</Text>
              </Box>
              
              <FormControl>
                <FormLabel>Investment Amount (USDC)</FormLabel>
                <NumberInput 
                  min={10} 
                  max={parseFloat(usdcBalance)}
                  precision={2}
                  value={investmentAmount}
                  onChange={setInvestmentAmount}
                >
                  <NumberInputField placeholder="Enter amount (min: 10 USDC)" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Minimum investment: 10 USDC
                </Text>
              </FormControl>

              {investmentAmount && parseFloat(investmentAmount) >= 10 && (
                <Box p={4} bg="blue.50" borderRadius="md">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Investment Summary</Text>
                  <VStack spacing={1} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.600">Amount (USDC):</Text>
                      <Text fontSize="xs" fontWeight="bold">{investmentAmount} USDC</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.600">Platform Fee (1.5%):</Text>
                      <Text fontSize="xs">{(parseFloat(investmentAmount) * 0.015).toFixed(2)} USDC</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.600">Net Investment:</Text>
                      <Text fontSize="xs" fontWeight="bold">{(parseFloat(investmentAmount) * 0.985).toFixed(2)} USDC</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.600">Expected Annual Return:</Text>
                      <Text fontSize="xs" color="green.600" fontWeight="bold">
                        {(parseFloat(investmentAmount) * 0.12).toFixed(2)} USDC (12%)
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              )}

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Investment Notice</AlertTitle>
                  <AlertDescription fontSize="xs">
                    Your investment will be processed on the blockchain. 
                    Please ensure you have enough MATIC for gas fees.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handleInvest}
              isLoading={isInvesting}
              loadingText="Processing..."
              isDisabled={!investmentAmount || parseFloat(investmentAmount) < 10 || parseFloat(investmentAmount) > parseFloat(usdcBalance)}
            >
              Confirm Investment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ProjectDetail;