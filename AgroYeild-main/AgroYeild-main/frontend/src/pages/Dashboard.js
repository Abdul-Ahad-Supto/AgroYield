import React from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  SimpleGrid, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Button, 
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Progress,
  Badge,
  Divider,
  HStack,
  VStack
} from '@chakra-ui/react';
import { FaSeedling, FaMoneyBillWave, FaChartLine, FaWallet } from 'react-icons/fa';

const Dashboard = () => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const emptyStateColor = useColorModeValue('gray.500', 'gray.400');
  
  // Mock data - in a real app, this would come from your smart contracts and API
  const stats = [
    { label: 'Total Invested', value: '৳24,500', icon: <FaMoneyBillWave size={24} />, change: '+12.5% from last month' },
    { label: 'Active Projects', value: '3', icon: <FaSeedling size={24} />, change: '1 new this month' },
    { label: 'Total Returns', value: '৳3,200', icon: <FaChartLine size={24} />, change: '+8.2% ROI' },
    { label: 'Wallet Balance', value: '৳12,340', icon: <FaWallet size={24} />, change: 'Available to invest' },
  ];
  
  const recentInvestments = [
    { id: 1, name: 'Organic Rice Farming', amount: '৳15,000', date: '2023-06-15', status: 'Active' },
    { id: 2, name: 'Mango Orchard', amount: '৳7,500', date: '2023-05-22', status: 'Active' },
    { id: 3, name: 'Dairy Farm', amount: '৳2,000', date: '2023-04-10', status: 'Completed' },
  ];
  
  const upcomingPayments = [
    { id: 1, project: 'Organic Rice Farming', amount: '৳1,200', dueDate: '2023-07-15' },
    { id: 2, project: 'Mango Orchard', amount: '৳850', dueDate: '2023-07-20' },
  ];

  return (
    <Container maxW={'7xl'} py={8}>
      <Stack spacing={8}>
        {/* Header */}
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Dashboard
          </Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Welcome back! Here's an overview of your investments.
          </Text>
        </Box>
        
        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {stats.map((stat, index) => (
            <Card key={index} bg={cardBg} boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
              <CardBody>
                <HStack justifyContent="space-between" mb={4}>
                  <Box p={3} bg="brand.50" borderRadius="lg" color="brand.500">
                    {stat.icon}
                  </Box>
                </HStack>
                <Stat>
                  <StatLabel color={secondaryTextColor}>
                    {stat.label}
                  </StatLabel>
                  <StatNumber fontSize="2xl" my={1}>
                    {stat.value}
                  </StatNumber>
                  <StatHelpText mb={0} color={textColor}>
                    {stat.change}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
        
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recent Investments */}
          <Card bg={cardBg} boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={2}>
              <Heading size="md">Recent Investments</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Stack spacing={4}>
                {recentInvestments.map((investment) => (
                  <Box key={investment.id}>
                    <HStack justifyContent="space-between" mb={1}>
                      <Text fontWeight="medium">{investment.name}</Text>
                      <Badge 
                        colorScheme={investment.status === 'Active' ? 'green' : 'gray'}
                        variant="subtle"
                        borderRadius="full"
                        px={2}
                      >
                        {investment.status}
                      </Badge>
                    </HStack>
                    <HStack justifyContent="space-between" color={secondaryTextColor}>
                      <Text fontSize="sm">Invested: {investment.amount}</Text>
                      <Text fontSize="sm">{investment.date}</Text>
                    </HStack>
                    <Divider my={2} />
                  </Box>
                ))}
              </Stack>
            </CardBody>
            <CardFooter pt={0}>
              <Button variant="link" colorScheme="brand">View all investments</Button>
            </CardFooter>
          </Card>
          
          {/* Upcoming Payments */}
          <Card bg={cardBg} boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={2}>
              <Heading size="md">Upcoming Payments</Heading>
            </CardHeader>
            <CardBody pt={0}>
              {upcomingPayments.length > 0 ? (
                <Stack spacing={4}>
                  {upcomingPayments.map((payment) => (
                    <Box key={payment.id}>
                      <HStack justifyContent="space-between" mb={1}>
                        <Text fontWeight="medium">{payment.project}</Text>
                        <Text fontWeight="bold">{payment.amount}</Text>
                      </HStack>
                      <HStack justifyContent="space-between" color={secondaryTextColor}>
                        <Text fontSize="sm">Due: {payment.dueDate}</Text>
                        <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={2}>
                          Upcoming
                        </Badge>
                      </HStack>
                      <Divider my={2} />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <VStack py={8} color={emptyStateColor}>
                  <Text>No upcoming payments</Text>
                  <Text fontSize="sm" textAlign="center">
                    Your next expected payments will appear here
                  </Text>
                </VStack>
              )}
            </CardBody>
            <CardFooter pt={0}>
              <Button variant="link" colorScheme="brand">View payment history</Button>
            </CardFooter>
          </Card>
        </SimpleGrid>
        
        {/* Quick Actions */}
        <Card bg={cardBg} boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={2}>
            <Heading size="md">Quick Actions</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Button 
                colorScheme="brand" 
                variant="outline" 
                leftIcon={<FaSeedling />}
                height="100px"
                whiteSpace="normal"
                textAlign="center"
                py={4}
              >
                Invest in New Project
              </Button>
              <Button 
                colorScheme="green" 
                variant="outline" 
                leftIcon={<FaMoneyBillWave />}
                height="100px"
                whiteSpace="normal"
                textAlign="center"
                py={4}
              >
                Add Funds to Wallet
              </Button>
              <Button 
                colorScheme="purple" 
                variant="outline" 
                leftIcon={<FaChartLine />}
                height="100px"
                whiteSpace="normal"
                textAlign="center"
                py={4}
              >
                View Performance Analytics
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>
      </Stack>
    </Container>
  );
};

export default Dashboard;
