import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  ListIcon
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

const ProjectDetail = () => {
  const { id } = useParams();
  const [tabIndex, setTabIndex] = useState(0);
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
  
  // Mock data - in a real app, this would come from your smart contracts
  const project = {
    id: id,
    title: 'Organic Rice Farming in Rangpur',
    farmer: '0x1234...5678',
    description: 'This project focuses on sustainable rice farming using organic methods in the Rangpur Division of Bangladesh. We aim to produce high-quality organic rice while maintaining soil health and biodiversity.',
    location: 'Rangpur Division, Bangladesh',
    category: 'Crop Farming',
    targetAmount: '50000',
    fundedAmount: '32500',
    investors: 24,
    daysLeft: 15,
    status: 'Funding',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f06?ixlib=rb-4.0.3&ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
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

  const fundingProgress = (project.fundedAmount / project.targetAmount) * 100;
  
  return (
    <Container maxW="7xl" py={8}>
      <Stack spacing={8}>
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

            <Tabs variant="enclosed" colorScheme="brand">
              <TabList>
                <Tab>Project Details</Tab>
                <Tab>Updates</Tab>
                <Tab>Team</Tab>
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
                            <Box>
                              <Text fontWeight="medium">{item.month}</Text>
                              <Text color={textColor}>
                                {item.description}
                              </Text>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    
                    <Box>
                      <Heading size="md" mb={4}>Risk Factors</Heading>
                      <List spacing={2}>
                        {project.details.risks.map((risk, index) => (
                          <ListItem key={index} display="flex">
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
                  <Text>Team information will be displayed here.</Text>
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
                    Raised of {project.targetAmount} BDT goal
                  </Text>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Text fontSize="2xl" fontWeight="bold" mr={2}>
                      {project.fundedAmount} BDT
                    </Text>
                    <Text color="green.500" fontWeight="medium">
                      {Math.round(fundingProgress)}%
                    </Text>
                  </Box>
                  <Progress value={fundingProgress} colorScheme="green" size="sm" borderRadius="full" />
                </Box>
                
                <Box display="flex" justifyContent="space-between">
                  <Box textAlign="center">
                    <Text fontSize="sm" color="gray.500">Backers</Text>
                    <Text fontWeight="bold">{project.investors}</Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="sm" color="gray.500">Days Left</Text>
                    <Text fontWeight="bold">{project.daysLeft}</Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="sm" color="gray.500">Status</Text>
                    <Badge colorScheme={project.status === 'Funding' ? 'blue' : 'green'}>
                      {project.status}
                    </Badge>
                  </Box>
                </Box>
                
                <Button 
                  colorScheme="brand" 
                  size="lg" 
                  width="full"
                  leftIcon={<FaMoneyBillWave />}
                  mb={2}
                >
                  Invest Now
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
                  <Text fontFamily="mono" color="gray.500">{project.id}</Text>
                </Box>
              </VStack>
            </Box>
            
            <Box 
              mt={6} 
              p={6} 
              bg={cardBg} 
              borderRadius="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>About the Farmer</Heading>
              <HStack spacing={4} mb={4}>
                <Box
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg="gray.200"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FaUser size={24} color="gray.500" />
                </Box>
                <Box>
                  <Text fontWeight="medium">Farm Owner</Text>
                  <Text fontSize="sm" color="gray.500">
                    {project.farmer}
                  </Text>
                </Box>
              </HStack>
              <Text mb={4}>
                Experienced farmer with 10+ years in organic agriculture. Committed to sustainable farming practices and community development.
              </Text>
              <Button variant="outline" colorScheme="brand" size="sm" width="full">
                View Farmer Profile
              </Button>
            </Box>
          </Box>
        </SimpleGrid>
      </Stack>
    </Container>
  );
};

export default ProjectDetail;
