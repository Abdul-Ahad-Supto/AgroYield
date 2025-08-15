import React, { useState, useEffect } from 'react'; // Added useEffect import
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Image, 
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
  List,
  ListItem,
  ListIcon,
  Card,
  CardBody,
  CardHeader,
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
  AlertDescription
} from '@chakra-ui/react';
import { 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaLeaf, 
  FaSeedling, 
  FaMoneyBillWave, 
  FaClock, 
  FaChartLine, 
  FaUsers, 
  FaShareAlt,
  FaBookmark,
  FaRegBookmark,
  FaArrowLeft,
  FaUser,
  FaCheckCircle
} from 'react-icons/fa';
import { useWeb3 } from '../contexts/Web3Context';
import { useContracts } from '../hooks/useContracts';

const InvestmentTracker = ({ projectId }) => {
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [totalFunded, setTotalFunded] = useState(0);
  const [targetAmount] = useState(50000); // BDT

  // Simulate real-time investments for demo
  useEffect(() => {
    const simulateInvestment = () => {
      const investors = [
        { name: "Ahmed Hassan", amount: 5000, avatar: "AH" },
        { name: "Fatima Khan", amount: 10000, avatar: "FK" },
        { name: "Rahim Uddin", amount: 7500, avatar: "RU" },
        { name: "Nasir Ahmed", amount: 12000, avatar: "NA" }
      ];

      const randomInvestor = investors[Math.floor(Math.random() * investors.length)];
      const newInvestment = {
        id: Date.now(),
        investor: randomInvestor.name,
        avatar: randomInvestor.avatar,
        amount: randomInvestor.amount,
        timestamp: new Date(),
        txHash: `0x${Math.random().toString(16).substr(2, 8)}...`
      };

      setRecentInvestments(prev => [newInvestment, ...prev.slice(0, 4)]);
      setTotalFunded(prev => prev + randomInvestor.amount);
    };

    // Add initial investment after 2 seconds for demo effect
    const timer = setTimeout(simulateInvestment, 2000);
    
    // Add more investments every 10 seconds during demo
    const interval = setInterval(simulateInvestment, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const fundingProgress = (totalFunded / targetAmount) * 100;

  return (
    <VStack spacing={4} align="stretch">
      {/* Funding Progress */}
      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontWeight="bold">Funding Progress</Text>
              <Text color="green.500" fontWeight="bold">
                {Math.round(fundingProgress)}%
              </Text>
            </HStack>
            <Progress 
              value={fundingProgress} 
              colorScheme="green" 
              size="lg" 
              borderRadius="md"
            />
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">
                {totalFunded.toLocaleString()} BDT raised
              </Text>
              <Text fontSize="sm" color="gray.500">
                Goal: {targetAmount.toLocaleString()} BDT
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Recent Investments */}
      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold">Recent Investments</Text>
            {recentInvestments.length === 0 ? (
              <Text color="gray.500" fontSize="sm">
                Waiting for investments...
              </Text>
            ) : (
              recentInvestments.map((investment) => (
                <HStack 
                  key={investment.id} 
                  justify="space-between" 
                  p={3} 
                  bg="green.50" 
                  borderRadius="md"
                  border="1px solid"
                  borderColor="green.200"
                >
                  <HStack>
                    <Avatar size="sm" name={investment.investor} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium" fontSize="sm">
                        {investment.investor}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {investment.timestamp.toLocaleTimeString()}
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack align="end" spacing={0}>
                    <Text fontWeight="bold" color="green.600">
                      +{investment.amount.toLocaleString()} BDT
                    </Text>
                    <Text fontSize="xs" color="gray.500" fontFamily="mono">
                      {investment.txHash}
                    </Text>
                  </VStack>
                </HStack>
              ))
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Investment Milestones */}
      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold">Funding Milestones</Text>
            {[
              { target: 25, label: "Project Launch", achieved: totalFunded >= targetAmount * 0.25 },
              { target: 50, label: "Equipment Purchase", achieved: totalFunded >= targetAmount * 0.50 },
              { target: 75, label: "Land Preparation", achieved: totalFunded >= targetAmount * 0.75 },
              { target: 100, label: "Full Funding", achieved: totalFunded >= targetAmount }
            ].map((milestone) => (
              <HStack key={milestone.target} justify="space-between">
                <Text fontSize="sm">
                  {milestone.label} ({milestone.target}%)
                </Text>
                <Badge 
                  colorScheme={milestone.achieved ? "green" : "gray"}
                  variant={milestone.achieved ? "solid" : "outline"}
                >
                  {milestone.achieved ? "✓ Achieved" : "Pending"}
                </Badge>
              </HStack>
            ))}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Web3 and contract hooks
  const { isConnected, account } = useWeb3();
  const { 
    getProject, 
    investInProject, 
    getProjectFunding, 
    getUSDCBalance, 
    convertUSDCToBDT,
    loading 
  } = useContracts();
  
  // Component state
  const [tabIndex, setTabIndex] = useState(0);
  const [project, setProject] = useState(null);
  const [funding, setFunding] = useState({ usdcAmount: '0', bdtAmount: '0' });
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInvesting, setIsInvesting] = useState(false);
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        console.log('Fetching project with ID:', id);
        
        // Fetch project details
        const projectData = await getProject(id);
        if (!projectData) {
          toast({
            title: 'Project Not Found',
            description: 'The requested project could not be found.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          navigate('/projects');
          return;
        }
        
        // Enrich project data with mock information for demo
        const enrichedProject = {
          ...projectData,
          image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
          details: {
            problem: 'Conventional rice farming often relies heavily on chemical fertilizers and pesticides, which can harm the environment and reduce soil fertility over time.',
            solution: 'This project implements organic farming techniques, including crop rotation, green manure, and natural pest control, to produce rice in an environmentally sustainable way.',
            impact: 'Expected to reduce chemical runoff by 80%, improve soil health, and provide a premium organic product to the market.',
            timeline: [
              { month: 'Month 1-2', description: 'Land preparation and soil enrichment' },
              { month: 'Month 3-4', description: 'Planting and initial growth phase' },
              { month: 'Month 5-6', description: 'Crop maintenance and monitoring' },
              { month: 'Month 7', description: 'Harvesting and post-harvest processing' },
              { month: 'Month 8', description: 'Distribution and sales' }
            ],
            risks: [
              'Weather conditions may affect crop yield',
              'Market price fluctuations for organic rice',
              'Pest or disease outbreaks'
            ]
          },
          updates: [
            { date: '2023-06-15', title: 'Project Launched', description: 'We\'re excited to announce the launch of our organic rice farming project!' },
            { date: '2023-06-20', title: '50% Funding Milestone', description: 'Thanks to our amazing backers, we\'ve reached 50% of our funding goal!' }
          ]
        };
        
        setProject(enrichedProject);
        
        // Fetch funding details
        const fundingData = await getProjectFunding(id);
        setFunding(fundingData);
        
        console.log('Project data:', enrichedProject);
        console.log('Funding data:', fundingData);
        
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: 'Error Loading Project',
          description: 'Failed to load project details. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectData();
  }, [id, getProject, getProjectFunding, toast, navigate]);

  // Fetch USDC balance when wallet is connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && account) {
        try {
          const balance = await getUSDCBalance(account);
          setUsdcBalance(balance);
        } catch (error) {
          console.error('Error fetching USDC balance:', error);
        }
      }
    };

    fetchBalance();
  }, [isConnected, account, getUSDCBalance]);

  const handleInvest = async () => {
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
      const result = await investInProject(id, investmentAmount);
      console.log('Investment successful:', result);
      
      // Refresh funding data
      const updatedFunding = await getProjectFunding(id);
      setFunding(updatedFunding);
      
      // Refresh balance
      const newBalance = await getUSDCBalance(account);
      setUsdcBalance(newBalance);
      
      // Close modal and reset amount
      onClose();
      setInvestmentAmount('');
      
    } catch (error) {
      console.error('Investment failed:', error);
    } finally {
      setIsInvesting(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="center" py={20}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text>Loading project details...</Text>
        </VStack>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Project Not Found!</AlertTitle>
          <AlertDescription>
            The requested project could not be found or does not exist.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const fundingProgress = project.targetAmountUSDC > 0 
    ? (parseFloat(funding.usdcAmount) / parseFloat(project.targetAmountUSDC)) * 100 
    : 0;

  const daysLeft = Math.max(0, Math.floor((new Date(project.endDate * 1000) - new Date()) / (1000 * 60 * 60 * 24)));

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
            <Image
              src={project.image}
              alt={project.title}
              borderRadius="lg"
              w="full"
              h={{ base: '300px', md: '400px' }}
              objectFit="cover"
              mb={6}
            />

            <Tabs variant="enclosed" colorScheme="brand" index={tabIndex} onChange={setTabIndex}>
              <TabList>
                <Tab>Project Details</Tab>
                <Tab>Updates</Tab>
                <Tab>Team</Tab>
                <Tab>Live Tracking</Tab>
              </TabList>

              <TabPanels py={6}>
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4}>The Problem</Heading>
                      <Text>{project.details.problem}</Text>
                    </Box>
                    
                    <Box>
                      <Heading size="md" mb={4}>Our Solution</Heading>
                      <Text>{project.details.solution}</Text>
                    </Box>
                    
                    <Box>
                      <Heading size="md" mb={4}>Expected Impact</Heading>
                      <Text>{project.details.impact}</Text>
                    </Box>
                    
                    <Box>
                      <Heading size="md" mb={4}>Project Timeline</Heading>
                      <List spacing={3}>
                        {project.details.timeline.map((item, index) => (
                          <ListItem key={index} display="flex" alignItems="flex-start">
                            <ListIcon as={FaCheckCircle} color="brand.500" mt={1} />
                            {risk}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </VStack>
                </TabPanel>
                
                <TabPanel px={0}>
                  <VStack spacing={6} align="stretch">
                    {project.updates.map((update, index) => (
                      <Box 
                        key={index} 
                        p={6} 
                        bg={cardBg} 
                        borderRadius="lg" 
                        borderWidth="1px" 
                        borderColor={borderColor}
                      >
                        <Text color="gray.500" mb={2}>
                          {update.date}
                        </Text>
                        <Heading size="md" mb={2}>
                          {update.title}
                        </Heading>
                        <Text>{update.description}</Text>
                      </Box>
                    ))}
                    
                    {project.updates.length === 0 && (
                      <Text>No updates available yet. Check back soon!</Text>
                    )}
                  </VStack>
                </TabPanel>
                
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Card>
                      <CardBody>
                        <HStack spacing={4} mb={4}>
                          <Avatar
                            size="lg"
                            name="Farm Owner"
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                          />
                          <Box>
                            <Text fontWeight="bold" fontSize="lg">Farm Owner</Text>
                            <Text fontSize="sm" color="gray.500" fontFamily="mono">
                              {project.farmer}
                            </Text>
                            <Badge colorScheme="green" mt={1}>Verified Farmer</Badge>
                          </Box>
                        </HStack>
                        <Text mb={4}>
                          Experienced farmer with 10+ years in organic agriculture. 
                          Committed to sustainable farming practices and community development.
                        </Text>
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Experience:</Text>
                            <Text fontSize="sm">10+ years</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Farm Size:</Text>
                            <Text fontSize="sm">5 acres</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Previous Projects:</Text>
                            <Text fontSize="sm">3 completed</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="gray.500">Success Rate:</Text>
                            <Text fontSize="sm" color="green.500">100%</Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>

                <TabPanel px={0}>
                  <InvestmentTracker projectId={id} />
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
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Raised of {parseFloat(project.targetAmountUSDC).toLocaleString()} USDC goal
                  </Text>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Text fontSize="2xl" fontWeight="bold" mr={2}>
                      {parseFloat(funding.usdcAmount).toFixed(2)} USDC
                    </Text>
                    <Text color="green.500" fontWeight="medium">
                      {Math.round(fundingProgress)}%
                    </Text>
                  </Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    ≈ {parseFloat(funding.bdtAmount).toLocaleString()} BDT
                  </Text>
                  <Progress value={fundingProgress} colorScheme="green" size="sm" borderRadius="full" />
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Box textAlign="center">
                    <Text fontSize="sm" color="gray.500">Backers</Text>
                    <Text fontWeight="bold">24</Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="sm" color="gray.500">Days Left</Text>
                    <Text fontWeight="bold">{daysLeft}</Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="sm" color="gray.500">Status</Text>
                    <Badge colorScheme={project.status === 1 ? 'green' : 'blue'}>
                      {project.status === 1 ? 'Active' : 'Funding'}
                    </Badge>
                  </Box>
                </Box>
                
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
                  isDisabled={!isConnected || project.status !== 1}
                >
                  {!isConnected ? 'Connect Wallet to Invest' : 'Invest Now'}
                </Button>
                
                <Button 
                  variant="outline" 
                  colorScheme="brand" 
                  size="lg" 
                  width="full"
                  leftIcon={<FaSeedling />}
                >
                  Follow Project
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
                  <Text fontWeight="medium" mb={2}>Category</Text>
                  <HStack color="gray.500">
                    <FaSeedling />
                    <Text>{project.category}</Text>
                  </HStack>
                </Box>
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Project ID</Text>
                  <Text fontFamily="mono" color="gray.500">#{project.id}</Text>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>Expected Return</Text>
                  <Text color="green.500" fontWeight="bold">12% annually</Text>
                  <Text fontSize="xs" color="gray.500">Based on historical data</Text>
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