import React from 'react';
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
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaSeedling, FaMoneyBillWave, FaClock } from 'react-icons/fa';

// Mock data - in a real app, this would come from your smart contracts
const projects = [
  {
    id: 1,
    title: 'Organic Rice Farming',
    description: 'Sustainable rice farming using organic methods in Rangpur Division.',
    targetAmount: '50,000',
    fundedAmount: '32,500',
    status: 'Funding',
    daysLeft: 15,
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f06?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 2,
    title: 'Mango Orchard Expansion',
    description: 'Expanding existing mango orchard with modern irrigation systems.',
    targetAmount: '75,000',
    fundedAmount: '75,000',
    status: 'In Progress',
    daysLeft: 45,
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 3,
    title: 'Dairy Farm Modernization',
    description: 'Upgrading dairy farm equipment and facilities for better milk production.',
    targetAmount: '100,000',
    fundedAmount: '45,200',
    status: 'Funding',
    daysLeft: 30,
    image: 'https://images.unsplash.com/photo-1534337621606-e3dcc5fdc4b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
  {
    id: 4,
    title: 'Hydroponic Vegetable Farm',
    description: 'Setting up a high-tech hydroponic farm for year-round vegetable production.',
    targetAmount: '120,000',
    fundedAmount: '118,500',
    status: 'Funding',
    daysLeft: 5,
    image: 'https://images.unsplash.com/photo-1596124579925-2beb6db8621b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
  },
];

const Projects = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const progressBg = useColorModeValue('gray.200', 'gray.600');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Funding':
        return 'blue';
      case 'In Progress':
        return 'green';
      case 'Completed':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <Container maxW={'7xl'} py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Explore Farming Projects
          </Heading>
          <Text color={secondaryTextColor}>
            Discover and support sustainable agriculture projects in Bangladesh
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {projects.map((project) => (
            <Card 
              key={project.id} 
              bg={cardBg}
              boxShadow="md"
              _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
              transition="all 0.2s"
              overflow="hidden"
            >
              <Box
                h="160px"
                bgImage={`url(${project.image})`}
                bgSize="cover"
                bgPosition="center"
                position="relative"
              >
                <Badge 
                  position="absolute" 
                  top={2} 
                  right={2} 
                  colorScheme={getStatusColor(project.status)}
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {project.status}
                </Badge>
              </Box>
              
              <CardBody>
                <Heading size="md" mb={2}>{project.title}</Heading>
                <Text color={textColor} mb={4} noOfLines={2}>
                  {project.description}
                </Text>
                
                <Stack spacing={4} mt={6}>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Funded</Text>
                    <Box 
                      bg={progressBg} 
                      h="8px" 
                      borderRadius="full"
                      overflow="hidden"
                    >
                      <Box 
                        bg="brand.500" 
                        h="100%" 
                        width={`${(parseInt(project.fundedAmount.replace(/,/g, '')) / parseInt(project.targetAmount.replace(/,/g, ''))) * 100}%`}
                        borderRadius="full"
                      />
                    </Box>
                    <Text fontSize="sm" mt={1}>
                      <Text as="span" fontWeight="bold" color="brand.500">
                        {project.fundedAmount} BDT
                      </Text>
                      <Text as="span" color="gray.500"> raised of {project.targetAmount} BDT</Text>
                    </Text>
                  </Box>
                  
                  <Stack direction="row" spacing={4} align="center">
                    <Box display="flex" alignItems="center">
                      <FaClock style={{ marginRight: '4px', color: '#4FD1C5' }} />
                      <Text fontSize="sm" color="gray.500">
                        {project.daysLeft} days left
                      </Text>
                    </Box>
                  </Stack>
                </Stack>
              </CardBody>
              
              <CardFooter pt={0}>
                <Button 
                  as={RouterLink}
                  to={`/projects/${project.id}`}
                  colorScheme="brand" 
                  width="full"
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
};

export default Projects;
