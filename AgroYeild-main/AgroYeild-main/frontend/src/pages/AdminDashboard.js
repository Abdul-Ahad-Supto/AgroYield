import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
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
  Card,
  CardBody,
  CardHeader,
  Divider,
  SimpleGrid,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Avatar,
  IconButton,
  Tooltip,
  Switch,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Center,
  Skeleton,
  Flex,
  Spacer,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Input,
  InputGroup,
  InputLeftElement,
  Select
} from '@chakra-ui/react';

import { 
  FaCheck, 
  FaTimes, 
  FaEye,   
  FaClock,
  FaBolt,
  FaSearch,
  FaFileAlt,
  FaMapMarkerAlt,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaRedo
} from 'react-icons/fa';
import { useWeb3 } from '../contexts/Web3Context';
import { useContracts } from '../hooks/useContracts';

const AdminDashboard = () => {
    // Color mode
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.50', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  // State Management
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { contracts, account, isConnected } = useWeb3();
  const { getAllProjects, checkUserRoles } = useContracts();
  const toast = useToast();


  // Check admin permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState({});

  useEffect(() => {
    const checkPermissions = async () => {
      if (isConnected && contracts) {
        try {
          const roles = await checkUserRoles();
          setUserRoles(roles);
          setIsAdmin(roles.isValidator || roles.isAdmin || account?.toLowerCase() === process.env.REACT_APP_ADMIN_ADDRESS?.toLowerCase());
        } catch (error) {
          console.error('Error checking permissions:', error);
        }
      }
    };

    checkPermissions();
  }, [isConnected, contracts, account, checkUserRoles]);

  // Fetch pending projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const allProjects = await getAllProjects();
        
        // Add mock verification data for demo
        const enrichedProjects = allProjects.map((project, index) => ({
          ...project,
          submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          farmerName: getFarmerName(project.farmer),
          documents: generateMockDocuments(),
          verificationNotes: '',
          priority: Math.random() > 0.7 ? 'High' : 'Normal',
          estimatedYield: `${(Math.random() * 5 + 3).toFixed(1)} tons`,
          riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
        }));

        setProjects(enrichedProjects);
        setFilteredProjects(enrichedProjects);
        
        // Calculate stats
        const newStats = {
          total: enrichedProjects.length,
          pending: enrichedProjects.filter(p => getStatusName(p.status) === 'Pending').length,
          approved: enrichedProjects.filter(p => getStatusName(p.status) === 'Approved').length,
          rejected: enrichedProjects.filter(p => getStatusName(p.status) === 'Rejected').length
        };
        setStats(newStats);

      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error Loading Projects',
          description: 'Failed to fetch projects from blockchain.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && isAdmin) {
      fetchProjects();
    }
  }, [isConnected, isAdmin, getAllProjects, toast]);

  // Filter projects
  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(project => getStatusName(project.status) === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter]);

  // Helper functions
  const getFarmerName = (address) => {
    const names = {
      '0x1234': 'Ahmed Hassan',
      '0x5678': 'Fatima Khan',
      '0x9abc': 'Rahim Uddin',
      '0xdef0': 'Nasir Ahmed'
    };
    const shortAddress = address.substring(0, 6);
    return names[shortAddress] || `Farmer ${shortAddress}...`;
  };

  const generateMockDocuments = () => [
    { name: 'National ID', status: 'verified', size: '2.1 MB' },
    { name: 'Land Ownership Certificate', status: 'verified', size: '1.8 MB' },
    { name: 'Business License', status: 'pending', size: '1.2 MB' },
    { name: 'Farm Photos', status: 'verified', size: '5.4 MB' }
  ];

  const getStatusName = (statusCode) => {
    const statuses = {
      0: 'Pending',
      1: 'Approved',
      2: 'Rejected',
      3: 'Active',
      4: 'Completed',
      5: 'Defaulted'
    };
    return statuses[statusCode] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'yellow',
      'Approved': 'green',
      'Rejected': 'red',
      'Active': 'blue',
      'Completed': 'purple',
      'Defaulted': 'red'
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority) => {
    return priority === 'High' ? 'red' : 'gray';
  };

  const getRiskColor = (risk) => {
    const colors = { 'Low': 'green', 'Medium': 'yellow', 'High': 'red' };
    return colors[risk] || 'gray';
  };

  // Verification functions
  const handleApproveProject = async (project) => {
    if (!contracts?.projectFactory) {
      toast({
        title: 'Contract Not Available',
        description: 'Please ensure your wallet is connected and contracts are loaded.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Call smart contract to verify project
      const tx = await contracts.projectFactory.verifyProject(project.id, true);
      
      toast({
        title: 'Transaction Submitted',
        description: 'Approval transaction sent to blockchain...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      const receipt = await tx.wait();
      
      // Update local state
      setProjects(prev => 
        prev.map(p => p.id === project.id ? { ...p, status: 1, verifiedBy: account } : p)
      );

      toast({
        title: '✅ Project Approved',
        description: `${project.title} has been approved and is now live!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      
    } catch (error) {
      console.error('Approval error:', error);
      
      let errorMessage = 'Failed to approve project';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      toast({
        title: 'Approval Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProject = async (project, reason = 'Does not meet platform requirements') => {
    if (!contracts?.projectFactory) {
      toast({
        title: 'Contract Not Available',
        description: 'Please ensure your wallet is connected and contracts are loaded.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Call smart contract to reject project
      const tx = await contracts.projectFactory.verifyProject(project.id, false);
      
      toast({
        title: 'Transaction Submitted',
        description: 'Rejection transaction sent to blockchain...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      const receipt = await tx.wait();
      
      // Update local state
      setProjects(prev => 
        prev.map(p => p.id === project.id ? { 
          ...p, 
          status: 2, 
          rejectionReason: reason,
          verifiedBy: account 
        } : p)
      );

      toast({
        title: '❌ Project Rejected',
        description: `${project.title} has been rejected.`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      
    } catch (error) {
      console.error('Rejection error:', error);
      
      let errorMessage = 'Failed to reject project';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      toast({
        title: 'Rejection Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickDemo = async (project, action) => {
    if (demoMode) {
      setIsProcessing(true);
      
      // Simulate blockchain transaction delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (action === 'approve') {
        await handleApproveProject(project);
      } else {
        await handleRejectProject(project, 'Demo rejection');
      }
      
      toast({
        title: '⚡ Demo Mode',
        description: `${action === 'approve' ? 'Approved' : 'Rejected'} instantly for demo!`,
        status: action === 'approve' ? 'success' : 'warning',
        duration: 2000,
      });
      
      setIsProcessing(false);
    }
  };

  const viewDetails = (project) => {
    setSelectedProject(project);
    onOpen();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  // Loading component
  const TableSkeleton = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <Tr key={i}>
          <Td><Skeleton height="20px" /></Td>
          <Td><Skeleton height="20px" /></Td>
          <Td><Skeleton height="20px" /></Td>
          <Td><Skeleton height="20px" /></Td>
          <Td><Skeleton height="20px" /></Td>
          <Td><Skeleton height="20px" /></Td>
        </Tr>
      ))}
    </>
  );

  // Access denied component
  if (!isConnected) {
    return (
      <Container maxW="7xl" py={8}>
        <Center py={20}>
          <Alert status="warning" borderRadius="lg" maxW="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>Please connect your wallet to access the admin dashboard.</AlertDescription>
            </Box>
          </Alert>
        </Center>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxW="7xl" py={8}>
        <Center py={20}>
          <Alert status="error" borderRadius="lg" maxW="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>You don't have permission to access this admin dashboard.</AlertDescription>
            </Box>
          </Alert>
        </Center>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex align="center" justify="space-between">
            <Box>
              <Heading as="h1" size="xl" mb={2} bgGradient="linear(to-r, blue.500, purple.600)" bgClip="text">
                🛡️ Oracle Admin Dashboard
              </Heading>
              <Text color="gray.600">
                Review and verify farming project submissions
              </Text>
            </Box>
            
            <HStack>
              {/* Demo Mode Toggle */}
              <Card p={3}>
                <HStack>
                  <Text fontSize="sm" fontWeight="medium">Demo Mode</Text>
                  <Switch 
                    isChecked={demoMode} 
                    onChange={(e) => setDemoMode(e.target.checked)}
                    colorScheme="orange"
                  />
                </HStack>
              </Card>
              
              <Button
                leftIcon={< FaRedo />}
                onClick={handleRefresh}
                isLoading={refreshing}
                variant="outline"
              >
                Refresh
              </Button>
            </HStack>
          </Flex>

          {/* Demo Mode Alert */}
          {demoMode && (
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>🎭 Demo Mode Enabled</AlertTitle>
                <AlertDescription>
                  Quick approval/rejection actions are available for smooth demonstration.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
            <StatCard
              title="Total Projects"
              value={stats.total}
              icon={FaFileAlt}
              color="blue"
              change="+12% this month"
            />
            <StatCard
              title="Pending Review"
              value={stats.pending}
              icon={FaClock}
              color="orange"
              change="Needs attention"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={FaCheckCircle}
              color="green"
              change={`${stats.total > 0 ? Math.round((stats.approved/stats.total)*100) : 0}% approval rate`}
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={FaTimesCircle}
              color="red"
              change="Quality control"
            />
          </SimpleGrid>

          {/* Filters */}
          <Card bg={cardBg} p={6} borderRadius="xl">
            <HStack spacing={4} wrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Select
                placeholder="All Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="150px"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Select>
              
              <Spacer />
              
              <Badge colorScheme="blue" px={3} py={1}>
                {filteredProjects.length} projects
              </Badge>
            </HStack>
          </Card>

          {/* Projects Table */}
          <Card bg={cardBg} borderRadius="xl" overflow="hidden">
            <CardHeader>
              <Heading size="md">Project Verification Queue</Heading>
            </CardHeader>
            <Divider />
            <CardBody p={0}>
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead bg={bgColor}>
                    <Tr>
                      <Th>Project</Th>
                      <Th>Farmer</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Priority</Th>
                      <Th>Submitted</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {loading ? (
                      <TableSkeleton />
                    ) : filteredProjects.length === 0 ? (
                      <Tr>
                        <Td colSpan={7}>
                          <Center py={8}>
                            <VStack>
                              <Icon as={FaExclamationTriangle} boxSize={8} color="gray.400" />
                              <Text color="gray.500">No projects found</Text>
                            </VStack>
                          </Center>
                        </Td>
                      </Tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <Tr key={project.id} _hover={{ bg: borderColor}}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium" noOfLines={1}>
                                {project.title}
                              </Text>
                              <HStack spacing={2}>
                                <Icon as={FaMapMarkerAlt} boxSize={3} color="gray.400" />
                                <Text fontSize="xs" color="gray.500">
                                  {project.location}
                                </Text>
                              </HStack>
                            </VStack>
                          </Td>
                          
                          <Td>
                            <HStack>
                              <Avatar size="sm" name={project.farmerName} />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {project.farmerName}
                                </Text>
                                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                                  {project.farmer.substring(0, 8)}...
                                </Text>
                              </VStack>
                            </HStack>
                          </Td>
                          
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">
                                {(parseFloat(project.targetAmountBDT) / 100).toLocaleString()} BDT
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                ≈ {(parseFloat(project.targetAmountUSDC) / 1e6).toFixed(0)} USDC
                              </Text>
                            </VStack>
                          </Td>
                          
                          <Td>
                            <Badge colorScheme={getStatusColor(getStatusName(project.status))}>
                              {getStatusName(project.status)}
                            </Badge>
                          </Td>
                          
                          <Td>
                            <Badge 
                              colorScheme={getPriorityColor(project.priority)}
                              variant={project.priority === 'High' ? 'solid' : 'outline'}
                            >
                              {project.priority}
                            </Badge>
                          </Td>
                          
                          <Td>
                            <Text fontSize="sm">
                              {new Date(project.submittedAt).toLocaleDateString()}
                            </Text>
                          </Td>
                          
                          <Td>
                            <HStack spacing={2}>
                              <Tooltip label="View Details">
                                <IconButton
                                  icon={<FaEye />}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewDetails(project)}
                                />
                              </Tooltip>
                              
                              {demoMode && getStatusName(project.status) === 'Pending' && (
                                <>
                                  <Tooltip label="⚡ Quick Approve">
                                    <Button
                                      size="sm"
                                      colorScheme="green"
                                      leftIcon={<FaCheck />}
                                      onClick={() => handleQuickDemo(project, 'approve')}
                                      isLoading={isProcessing}
                                    >
                                      Approve
                                    </Button>
                                  </Tooltip>
                                  <Tooltip label="⚡ Quick Reject">
                                    <Button
                                      size="sm"
                                      colorScheme="red"
                                      variant="outline"
                                      leftIcon={<FaTimes />}
                                      onClick={() => handleQuickDemo(project, 'reject')}
                                      isLoading={isProcessing}
                                    >
                                      Reject
                                    </Button>
                                  </Tooltip>
                                </>
                              )}
                              
                              {!demoMode && getStatusName(project.status) === 'Pending' && (
                                <>
                                  <Tooltip label="Approve">
                                    <IconButton
                                      icon={<FaCheck />}
                                      size="sm"
                                      colorScheme="green"
                                      onClick={() => handleApproveProject(project)}
                                      isLoading={isProcessing}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Reject">
                                    <IconButton
                                      icon={<FaTimes />}
                                      size="sm"
                                      colorScheme="red"
                                      variant="outline"
                                      onClick={() => viewDetails(project)}
                                    />
                                  </Tooltip>
                                </>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </VStack>

        {/* Project Detail Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="4xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <Text>Project Verification</Text>
                {demoMode && <Badge colorScheme="orange">Demo Mode</Badge>}
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedProject && (
                <Tabs>
                  <TabList>
                    <Tab>Project Details</Tab>
                    <Tab>Documents</Tab>
                    <Tab>Risk Assessment</Tab>
                    {demoMode && <Tab>🎭 Quick Actions</Tab>}
                  </TabList>

                  <TabPanels>
                    {/* Project Details Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <SimpleGrid columns={2} spacing={4}>
                          <FormControl>
                            <FormLabel>Project Title</FormLabel>
                            <Text fontWeight="bold">{selectedProject.title}</Text>
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Category</FormLabel>
                            <Badge colorScheme="blue">{selectedProject.category}</Badge>
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Farmer</FormLabel>
                            <HStack>
                              <Avatar size="sm" name={selectedProject.farmerName} />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">{selectedProject.farmerName}</Text>
                                <Text fontSize="sm" color="gray.500" fontFamily="mono">
                                  {selectedProject.farmer}
                                </Text>
                              </VStack>
                            </HStack>
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Location</FormLabel>
                            <Text>{selectedProject.location}</Text>
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Target Amount</FormLabel>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold">
                                {(parseFloat(selectedProject.targetAmountBDT) / 100).toLocaleString()} BDT
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                ≈ {(parseFloat(selectedProject.targetAmountUSDC) / 1e6).toFixed(0)} USDC
                              </Text>
                            </VStack>
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Estimated Yield</FormLabel>
                            <Text>{selectedProject.estimatedYield}</Text>
                          </FormControl>
                        </SimpleGrid>
                        
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Text>{selectedProject.description}</Text>
                        </FormControl>
                      </VStack>
                    </TabPanel>

                    {/* Documents Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <Text fontWeight="bold">Submitted Documents</Text>
                        {selectedProject.documents.map((doc, index) => (
                          <Card key={index} variant="outline">
                            <CardBody>
                              <HStack justify="space-between">
                                <HStack>
                                  <Icon as={FaFileAlt} color="blue.500" />
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium">{doc.name}</Text>
                                    <Text fontSize="sm" color="gray.500">{doc.size}</Text>
                                  </VStack>
                                </HStack>
                                <HStack>
                                  <Badge 
                                    colorScheme={doc.status === 'verified' ? 'green' : 'yellow'}
                                  >
                                    {doc.status}
                                  </Badge>
                                  <Button size="sm" leftIcon={<FaDownload />}>
                                    Download
                                  </Button>
                                </HStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </TabPanel>

                
                    {/* Risk Assessment Tab */}
                    <TabPanel>
                      <VStack spacing={6} align="stretch">
                        <SimpleGrid columns={2} spacing={4}>
                          <Card>
                            <CardBody>
                              <Stat>
                                <StatLabel>Risk Level</StatLabel>
                                <StatNumber>
                                  <Badge 
                                    colorScheme={getRiskColor(selectedProject.riskLevel)}
                                    fontSize="md"
                                    p={2}
                                  >
                                    {selectedProject.riskLevel}
                                  </Badge>
                                </StatNumber>
                                <StatHelpText>Based on historical data</StatHelpText>
                              </Stat>
                            </CardBody>
                          </Card>
                          
                          <Card>
                            <CardBody>
                              <Stat>
                                <StatLabel>Success Probability</StatLabel>
                                <StatNumber color="green.500">85%</StatNumber>
                                <StatHelpText>
                                  <StatArrow type="increase" />
                                  Above average
                                </StatHelpText>
                              </Stat>
                            </CardBody>
                          </Card>
                        </SimpleGrid>
                        
                        <Alert status="info">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Risk Assessment</AlertTitle>
                            <AlertDescription>
                              This project shows {selectedProject.riskLevel.toLowerCase()} risk based on location, 
                              crop type, farmer experience, and market conditions.
                            </AlertDescription>
                          </Box>
                        </Alert>
                        
                        <FormControl>
                          <FormLabel>Risk Factors</FormLabel>
                          <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between">
                              <Text>Weather dependency</Text>
                              <Badge colorScheme="yellow">Medium</Badge>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Market volatility</Text>
                              <Badge colorScheme="green">Low</Badge>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Farmer experience</Text>
                              <Badge colorScheme="green">High</Badge>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Infrastructure</Text>
                              <Badge colorScheme="yellow">Medium</Badge>
                            </HStack>
                          </VStack>
                        </FormControl>
                      </VStack>
                    </TabPanel>

                    {/* Quick Actions Tab - Demo Mode Only */}
                    {demoMode && (
                      <TabPanel>
                        <VStack spacing={6}>
                          <Alert status="info">
                            <AlertIcon />
                            <Box>
                              <AlertTitle>🎭 Demo Mode Actions</AlertTitle>
                              <AlertDescription>
                                These are simplified actions for demonstration purposes. 
                                In production, full verification workflow would be required.
                              </AlertDescription>
                            </Box>
                          </Alert>
                          
                          <SimpleGrid columns={2} spacing={6} w="full">
                            <Card borderColor="green.200" borderWidth="2px">
                              <CardBody textAlign="center">
                                <VStack spacing={4}>
                                  <Icon as={FaCheckCircle} boxSize={12} color="green.500" />
                                  <Text fontWeight="bold" fontSize="lg">Approve Project</Text>
                                  <Text fontSize="sm" color="gray.600">
                                    Mark this project as verified and ready for funding.
                                  </Text>
                                  <Button 
                                    colorScheme="green" 
                                    size="lg"
                                    leftIcon={<FaCheck />}
                                    onClick={() => handleQuickDemo(selectedProject, 'approve')}
                                    isLoading={isProcessing}
                                    w="full"
                                  >
                                    ⚡ Quick Approve
                                  </Button>
                                </VStack>
                              </CardBody>
                            </Card>
                            
                            <Card borderColor="red.200" borderWidth="2px">
                              <CardBody textAlign="center">
                                <VStack spacing={4}>
                                  <Icon as={FaTimesCircle} boxSize={12} color="red.500" />
                                  <Text fontWeight="bold" fontSize="lg">Reject Project</Text>
                                  <Text fontSize="sm" color="gray.600">
                                    Mark this project as not meeting requirements.
                                  </Text>
                                  <Button 
                                    colorScheme="red" 
                                    size="lg"
                                    leftIcon={<FaTimes />}
                                    onClick={() => handleQuickDemo(selectedProject, 'reject')}
                                    isLoading={isProcessing}
                                    w="full"
                                  >
                                    ⚡ Quick Reject
                                  </Button>
                                </VStack>
                              </CardBody>
                            </Card>
                          </SimpleGrid>

                          <Card bg="orange.50" borderColor="orange.200" w="full">
                            <CardBody>
                              <VStack spacing={3}>
                                <HStack>
                                  <Icon as={FaBolt} color="orange.500" />
                                  <Text fontWeight="bold">Demo Benefits</Text>
                                </HStack>
                                <Text fontSize="sm" textAlign="center">
                                  • Instant blockchain transactions<br/>
                                  • Simplified verification workflow<br/>
                                  • Real-time status updates<br/>
                                  • No complex approval process
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                        </VStack>
                      </TabPanel>
                    )}
                  </TabPanels>
                </Tabs>
              )}
            </ModalBody>

            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                
                {!demoMode && selectedProject && getStatusName(selectedProject.status) === 'Pending' && (
                  <>
                    <Button 
                      colorScheme="red" 
                      leftIcon={<FaTimes />}
                      onClick={() => handleRejectProject(selectedProject, 'Does not meet requirements')}
                      isLoading={isProcessing}
                    >
                      Reject Project
                    </Button>
                    <Button 
                      colorScheme="green" 
                      leftIcon={<FaCheck />}
                      onClick={() => handleApproveProject(selectedProject)}
                      isLoading={isProcessing}
                    >
                      Approve Project
                    </Button>
                  </>
                )}
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

// StatCard Component
const StatCard = ({ title, value, icon: IconComponent, color, change }) => {
const cardBg = useColorModeValue('white', 'gray.700');
const borderColor = useColorModeValue('gray.50', 'gray.700');
const bgColor = useColorModeValue('gray.50', 'gray.900');
  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardBody>
        <HStack justify="space-between">
          <Box>
            <Text fontSize="sm" color="gray.500" mb={1}>
              {title}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" mb={1}>
              {value}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {change}
            </Text>
          </Box>
          <Box 
            p={3} 
            bg={`${color}.50`} 
            color={`${color}.600`} 
            borderRadius="full"
          >
            <Icon as={IconComponent} boxSize={5} />
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );
};

export default AdminDashboard;        