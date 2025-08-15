import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  SimpleGrid, 
  Card, 
  CardBody, 
  CardFooter, 
  Button, 
  Text, 
  Badge,
  Stack,
  useColorModeValue,
  Progress,
  HStack,
  VStack,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
  Input,
  Select,
  Flex,
  Icon,
  useToast,
  Image,
  Divider,
  Tooltip,
  InputGroup,
  InputLeftElement,
  Skeleton,
  SkeletonText,
  Center,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  FaSeedling, 
  FaMoneyBillWave, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUser,
  FaSearch,
  FaFilter,
  FaChartLine,
  FaLeaf,
  FaAppleAlt,
  FaCarrot,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye
} from 'react-icons/fa';
import { useWeb3 } from '../contexts/Web3Context.Backup';
import { useContracts } from '../hooks/useContracts';

const Projects = () => {
  // State management
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fundingData, setFundingData] = useState({});
  const [loadingFunding, setLoadingFunding] = useState({});
  const [error, setError] = useState(null);
  
  const { isConnected } = useWeb3();
  const { getAllProjects, getProjectFunding, convertUSDCToBDT } = useContracts();
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Fetch projects from blockchain
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching projects from blockchain...');
        const projectsData = await getAllProjects();
        
        if (!projectsData || projectsData.length === 0) {
          setProjects([]);
          setFilteredProjects([]);
          return;
        }

        // Enrich projects with additional data
        const enrichedProjects = projectsData.map((project) => ({
          ...project,
          image: getProjectImage(project.category),
          farmerName: getFarmerName(project.farmer),
          daysLeft: calculateDaysLeft(project.endDate),
          status: getProjectStatus(project.status),
          fundingProgress: 0, // Will be updated from funding data
        }));

        setProjects(enrichedProjects);
        setFilteredProjects(enrichedProjects);
        
        // Fetch funding data for each project
        enrichedProjects.forEach(project => {
          fetchProjectFunding(project.id);
        });
        
        console.log('Projects loaded:', enrichedProjects);
        
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please check your connection and try again.');
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

    fetchProjects();
  }, [getAllProjects, toast]);

  // Fetch funding data for individual project
  const fetchProjectFunding = async (projectId) => {
    try {
      setLoadingFunding(prev => ({ ...prev, [projectId]: true }));
      
      const funding = await getProjectFunding(projectId);
      
      setFundingData(prev => ({ 
        ...prev, 
        [projectId]: {
          usdcAmount: funding.usdcAmount || '0',
          bdtAmount: funding.bdtAmount || '0'
        }
      }));

      // Update project funding progress
      setProjects(prev => prev.map(project => {
        if (project.id === projectId.toString()) {
          const fundedUSDC = parseFloat(funding.usdcAmount || '0');
          const targetUSDC = parseFloat(project.targetAmountUSDC) / 1e6; // Convert from wei
          const progress = targetUSDC > 0 ? (fundedUSDC / targetUSDC) * 100 : 0;
          
          return { ...project, fundingProgress: Math.min(progress, 100) };
        }
        return project;
      }));
      
    } catch (error) {
      console.error(`Error fetching funding for project ${projectId}:`, error);
    } finally {
      setLoadingFunding(prev => ({ ...prev, [projectId]: false }));
    }
  };

  // Filter projects based on search and filters
  useEffect(() => {
    let filtered = projects;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(project => project.category === categoryFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, categoryFilter, statusFilter]);

  // Helper functions
  const getProjectImage = (category) => {
    const images = {
      'Rice Cultivation': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f06?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Fruit Cultivation': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Vegetable Cultivation': 'https://images.unsplash.com/photo-1596124579925-2beb6db8621b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Livestock': 'https://images.unsplash.com/photo-1534337621606-e3dcc5fdc4b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Fisheries': 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'Agroforestry': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    };
    return images[category] || images['Rice Cultivation'];
  };

  const getFarmerName = (address) => {
    const names = {
      '0x1234': 'Ahmed Hassan',
      '0x5678': 'Fatima Khan', 
      '0x9abc': 'Rahim Uddin',
      '0xdef0': 'Nasir Ahmed'
    };
    const shortAddress = address.substring(0, 6);
    return names[shortAddress] || `${shortAddress}...`;
  };

  const calculateDaysLeft = (endTimestamp) => {
    if (!endTimestamp || endTimestamp === '0') return 'N/A';
    const endDate = new Date(parseInt(endTimestamp) * 1000);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getProjectStatus = (statusCode) => {
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

  const getCategoryIcon = (category) => {
    const icons = {
      'Rice Cultivation': FaSeedling,
      'Fruit Cultivation': FaAppleAlt,
      'Vegetable Cultivation': FaCarrot,
      'Livestock': FaUser,
      'Fisheries': FaChartLine,
      'Agroforestry': FaLeaf
    };
    return icons[category] || FaSeedling;
  };

  // Loading skeleton component
  const ProjectSkeleton = () => (
    <Card bg={cardBg} overflow="hidden">
      <Skeleton height="160px" />
      <CardBody>
        <SkeletonText mt={4} noOfLines={3} spacing={4} />
        <Skeleton height="20px" mt={4} />
        <Skeleton height="30px" mt={4} />
      </CardBody>
      <CardFooter>
        <Skeleton height="40px" width="100%" />
      </CardFooter>
    </Card>
  );

  // Project card component
  const ProjectCard = ({ project }) => {
    const funding = fundingData[project.id] || { usdcAmount: '0', bdtAmount: '0' };
    const isLoadingFunding = loadingFunding[project.id];
    const CategoryIcon = getCategoryIcon(project.category);
    
    // Calculate funding amounts
    const fundedUSDC = parseFloat(funding.usdcAmount);
    const targetUSDC = parseFloat(project.targetAmountUSDC) / 1e6; // Convert from wei
    const fundedBDT = parseFloat(funding.bdtAmount);
    const targetBDT = parseFloat(project.targetAmountBDT) / 100; // Convert from scaled BDT
    
    const fundingProgress = targetUSDC > 0 ? (fundedUSDC / targetUSDC) * 100 : 0;

    return (
      <Card 
        bg={cardBg}
        boxShadow="md"
        _hover={{ 
          transform: 'translateY(-4px)', 
          shadow: 'xl',
          borderColor: 'brand.500'
        }}
        transition="all 0.3s ease"
        overflow="hidden"
        borderWidth="1px"
        borderColor={borderColor}
        position="relative"
      >
        {/* Project Image */}
        <Box height="200px" position="relative" overflow="hidden">
          <Image
            src={project.image}
            alt={project.title}
            objectFit="cover"
            width="100%"
            height="100%"
            transition="transform 0.3s ease"
            _hover={{ transform: 'scale(1.05)' }}
          />
          
          {/* Status Badge */}
          <Badge 
            position="absolute" 
            top={3} 
            right={3} 
            colorScheme={getStatusColor(project.status)}
            px={3}
            py={1}
            borderRadius="full"
            fontWeight="bold"
            boxShadow="md"
          >
            {project.status}
          </Badge>
          
          {/* Category Icon */}
          <Box
            position="absolute"
            top={3}
            left={3}
            bg="whiteAlpha.900"
            p={2}
            borderRadius="full"
            boxShadow="md"
          >
            <Icon as={CategoryIcon} color="brand.500" boxSize={4} />
          </Box>
        </Box>
        
        <CardBody pb={3}>
          {/* Project Title */}
          <Heading size="md" mb={2} noOfLines={2} lineHeight="shorter">
            {project.title}
          </Heading>
          
          {/* Project Description */}
          <Text color={textColor} mb={3} noOfLines={2} fontSize="sm">
            {project.description}
          </Text>
          
          {/* Farmer Info */}
          <HStack mb={3} spacing={2}>
            <Avatar size="xs" name={project.farmerName} />
            <Text fontSize="sm" color={secondaryTextColor}>
              by {project.farmerName}
            </Text>
          </HStack>
          
          {/* Location */}
          <HStack mb={4} spacing={2}>
            <Icon as={FaMapMarkerAlt} color="brand.500" boxSize={3} />
            <Text fontSize="sm" color={secondaryTextColor}>
              {project.location}
            </Text>
          </HStack>
          
          {/* Funding Progress */}
          <Box mb={4}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="medium">
                Funding Progress
              </Text>
              <Text fontSize="sm" color="brand.500" fontWeight="bold">
                {Math.round(fundingProgress)}%
              </Text>
            </HStack>
            
            <Progress 
              value={fundingProgress} 
              colorScheme="brand" 
              size="sm" 
              borderRadius="full"
              bg={useColorModeValue('gray.200', 'gray.600')}
            />
            
            <HStack justify="space-between" mt={2}>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color={secondaryTextColor}>Raised</Text>
                {isLoadingFunding ? (
                  <Skeleton height="16px" width="60px" />
                ) : (
                  <Text fontSize="sm" fontWeight="bold" color="brand.500">
                    {fundedUSDC.toFixed(2)} USDC
                  </Text>
                )}
                <Text fontSize="xs" color={secondaryTextColor}>
                  ≈ {fundedBDT.toLocaleString()} BDT
                </Text>
              </VStack>
              
              <VStack align="end" spacing={0}>
                <Text fontSize="xs" color={secondaryTextColor}>Goal</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {targetUSDC.toFixed(2)} USDC
                </Text>
                <Text fontSize="xs" color={secondaryTextColor}>
                  ≈ {targetBDT.toLocaleString()} BDT
                </Text>
              </VStack>
            </HStack>
          </Box>
          
          {/* Project Stats */}
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color={secondaryTextColor}>Days Left</Text>
              <HStack spacing={1}>
                <Icon as={FaClock} color="orange.500" boxSize={3} />
                <Text fontSize="sm" fontWeight="bold">
                  {project.daysLeft === 'N/A' ? 'N/A' : `${project.daysLeft} days`}
                </Text>
              </HStack>
            </VStack>
            
            <VStack align="end" spacing={0}>
              <Text fontSize="xs" color={secondaryTextColor}>Investors</Text>
              <HStack spacing={1}>
                <Icon as={FaUser} color="purple.500" boxSize={3} />
                <Text fontSize="sm" fontWeight="bold">
                  {Math.floor(Math.random() * 20) + 5}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </CardBody>
        
        <CardFooter pt={0}>
          <Button 
            as={RouterLink}
            to={`/projects/${project.id}`}
            colorScheme="brand" 
            width="100%"
            leftIcon={<FaEye />}
            _hover={{ transform: 'translateY(-1px)' }}
            transition="all 0.2s"
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // If not connected to wallet
  if (!isConnected) {
    return (
      <Container maxW="7xl" py={8}>
        <Center py={20}>
          <Alert status="warning" borderRadius="lg" maxW="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Wallet Not Connected</Text>
              <Text fontSize="sm">Please connect your wallet to view projects.</Text>
            </Box>
          </Alert>
        </Center>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="7xl" py={8}>
        <Stack spacing={8}>
          {/* Header */}
          <Box>
            <Heading as="h1" size="2xl" mb={2} bgGradient="linear(to-r, brand.500, brand.600)" bgClip="text">
              Explore Farming Projects
            </Heading>
            <Text color={secondaryTextColor} fontSize="lg">
              Discover and support sustainable agriculture projects in Bangladesh
            </Text>
          </Box>

          {/* Filters */}
          <Card bg={cardBg} p={6} borderRadius="xl" boxShadow="sm">
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
              <InputGroup maxW={{ base: '100%', md: '300px' }}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="lg"
                />
              </InputGroup>
              
              <Select
                placeholder="All Categories"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                maxW={{ base: '100%', md: '200px' }}
                borderRadius="lg"
              >
                <option value="Rice Cultivation">Rice Cultivation</option>
                <option value="Fruit Cultivation">Fruit Cultivation</option>
                <option value="Vegetable Cultivation">Vegetable Cultivation</option>
                <option value="Livestock">Livestock</option>
                <option value="Fisheries">Fisheries</option>
                <option value="Agroforestry">Agroforestry</option>
              </Select>
              
              <Select
                placeholder="All Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW={{ base: '100%', md: '150px' }}
                borderRadius="lg"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </Select>
            </Stack>
          </Card>

          {/* Projects Grid */}
          {error ? (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Error Loading Projects</Text>
                <Text fontSize="sm">{error}</Text>
              </Box>
            </Alert>
          ) : loading ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {[...Array(6)].map((_, i) => (
                <ProjectSkeleton key={i} />
              ))}
            </SimpleGrid>
          ) : filteredProjects.length === 0 ? (
            <Center py={20}>
              <VStack spacing={4}>
                <Icon as={FaExclamationTriangle} boxSize={12} color="gray.400" />
                <Text fontSize="xl" color="gray.500">No projects found</Text>
                <Text color="gray.400">Try adjusting your search filters</Text>
              </VStack>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </SimpleGrid>
          )}

          {/* Stats Footer */}
          {!loading && !error && (
            <Card bg={cardBg} p={6} borderRadius="xl" boxShadow="sm">
              <HStack justify="space-around" textAlign="center">
                <VStack>
                  <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                    {projects.length}
                  </Text>
                  <Text color={secondaryTextColor}>Total Projects</Text>
                </VStack>
                <VStack>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {projects.filter(p => p.status === 'Active').length}
                  </Text>
                  <Text color={secondaryTextColor}>Active Projects</Text>
                </VStack>
                <VStack>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                    {projects.filter(p => p.fundingProgress >= 100).length}
                  </Text>
                  <Text color={secondaryTextColor}>Fully Funded</Text>
                </VStack>
              </HStack>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default Projects;