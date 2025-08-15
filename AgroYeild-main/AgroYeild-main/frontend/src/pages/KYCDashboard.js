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
  Input,
  Select,
  Textarea,
  Image,
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
  Tooltip
} from '@chakra-ui/react';
import { FaCheck, FaTimes, FaEye, FaUser, FaIdCard, FaShieldAlt } from 'react-icons/fa';
import { useWeb3 } from '../contexts/Web3Context';

const KYCDashboard = () => {
  const { contracts, account, isConnected } = useWeb3();
  const [kycRequests, setKycRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Mock KYC requests for demo
  const mockKYCRequests = [
    {
      id: 1,
      address: '0x1234...5678',
      name: 'Karim Ahmed',
      role: 'Farmer',
      documentType: 'NID',
      documentNumber: '1990123456789',
      location: 'Rangpur, Bangladesh',
      submittedAt: '2025-01-10 14:30',
      status: 'Pending',
      documents: {
        nidFront: '/api/placeholder/400/250',
        nidBack: '/api/placeholder/400/250',
        selfie: '/api/placeholder/300/300'
      },
      details: {
        email: 'karim@example.com',
        phone: '+880 1712345678',
        farmSize: '5 acres',
        experience: '10 years'
      }
    },
    {
      id: 2,
      address: '0x8765...4321',
      name: 'Fatima Begum',
      role: 'Investor',
      documentType: 'Passport',
      documentNumber: 'BD1234567',
      location: 'Dhaka, Bangladesh',
      submittedAt: '2025-01-10 15:45',
      status: 'Pending',
      documents: {
        passport: '/api/placeholder/400/250',
        selfie: '/api/placeholder/300/300'
      },
      details: {
        email: 'fatima@example.com',
        phone: '+880 1812345678',
        investmentCapacity: '100,000 BDT'
      }
    }
  ];

  useEffect(() => {
    // Load KYC requests
    setKycRequests(mockKYCRequests);
  }, []);

  const handleApproveKYC = async (request) => {
    setIsProcessing(true);
    try {
      if (contracts.identityRegistry) {
        // Issue verifiable credential
        const tx = await contracts.identityRegistry.issueCredential(
          request.address,
          3, // KYC_VERIFICATION type
          `ipfs://QmKYC${request.id}`, // Mock IPFS hash
          31536000 // 1 year validity
        );
        await tx.wait();
        
        // Grant appropriate role
        if (request.role === 'Farmer' && contracts.projectFactory) {
          const FARMER_ROLE = await contracts.projectFactory.FARMER_ROLE();
          await contracts.projectFactory.grantRole(FARMER_ROLE, request.address);
        } else if (request.role === 'Investor' && contracts.investmentManager) {
          const INVESTOR_ROLE = await contracts.investmentManager.INVESTOR_ROLE();
          await contracts.investmentManager.grantRole(INVESTOR_ROLE, request.address);
        }
      }

      // Update local state
      setKycRequests(prev => 
        prev.map(r => r.id === request.id ? {...r, status: 'Approved'} : r)
      );

      toast({
        title: 'KYC Approved',
        description: `${request.name} has been verified as ${request.role}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('KYC approval error:', error);
      toast({
        title: 'Approval Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectKYC = async (request, reason) => {
    setIsProcessing(true);
    try {
      // Update status
      setKycRequests(prev => 
        prev.map(r => r.id === request.id ? {...r, status: 'Rejected', rejectionReason: reason} : r)
      );

      toast({
        title: 'KYC Rejected',
        description: `${request.name}'s KYC has been rejected`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('KYC rejection error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    onOpen();
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      'Pending': 'yellow',
      'Approved': 'green',
      'Rejected': 'red',
      'Under Review': 'blue'
    };
    return <Badge colorScheme={colorMap[status]}>{status}</Badge>;
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            KYC Management Dashboard
          </Heading>
          <Text color="gray.600">
            Review and approve user verification requests
          </Text>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="sm" color="gray.500">Pending</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {kycRequests.filter(r => r.status === 'Pending').length}
                  </Text>
                </Box>
                <Box p={3} bg="yellow.100" borderRadius="lg">
                  <FaClock color="orange" />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="sm" color="gray.500">Approved</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {kycRequests.filter(r => r.status === 'Approved').length}
                  </Text>
                </Box>
                <Box p={3} bg="green.100" borderRadius="lg">
                  <FaCheck color="green" />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="sm" color="gray.500">Total Farmers</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {kycRequests.filter(r => r.role === 'Farmer').length}
                  </Text>
                </Box>
                <Box p={3} bg="blue.100" borderRadius="lg">
                  <FaUser color="blue" />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="sm" color="gray.500">Total Investors</Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {kycRequests.filter(r => r.role === 'Investor').length}
                  </Text>
                </Box>
                <Box p={3} bg="purple.100" borderRadius="lg">
                  <FaShieldAlt color="purple" />
                </Box>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* KYC Requests Table */}
        <Card>
          <CardHeader>
            <Heading size="md">KYC Verification Requests</Heading>
          </CardHeader>
          <Divider />
          <CardBody p={0}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th>Document</Th>
                  <Th>Location</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {kycRequests.map((request) => (
                  <Tr key={request.id}>
                    <Td>
                      <HStack>
                        <Avatar size="sm" name={request.name} />
                        <Box>
                          <Text fontWeight="medium">{request.name}</Text>
                          <Text fontSize="xs" color="gray.500">{request.address}</Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={request.role === 'Farmer' ? 'green' : 'purple'}>
                        {request.role}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{request.documentType}</Text>
                      <Text fontSize="xs" color="gray.500">{request.documentNumber}</Text>
                    </Td>
                    <Td>{request.location}</Td>
                    <Td>{request.submittedAt}</Td>
                    <Td>{getStatusBadge(request.status)}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="View Details">
                          <IconButton
                            icon={<FaEye />}
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(request)}
                          />
                        </Tooltip>
                        {request.status === 'Pending' && (
                          <>
                            <Tooltip label="Quick Approve">
                              <IconButton
                                icon={<FaCheck />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleApproveKYC(request)}
                                isLoading={isProcessing}
                              />
                            </Tooltip>
                            <Tooltip label="Reject">
                              <IconButton
                                icon={<FaTimes />}
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => viewDetails(request)}
                              />
                            </Tooltip>
                          </>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>

      {/* Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>KYC Verification Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRequest && (
              <Tabs>
                <TabList>
                  <Tab>Personal Info</Tab>
                  <Tab>Documents</Tab>
                  <Tab>Verification</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontWeight="bold" mb={1}>Full Name</Text>
                        <Text>{selectedRequest.name}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={1}>Role</Text>
                        <Badge colorScheme={selectedRequest.role === 'Farmer' ? 'green' : 'purple'}>
                          {selectedRequest.role}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={1}>Wallet Address</Text>
                        <Text fontFamily="mono">{selectedRequest.address}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={1}>Location</Text>
                        <Text>{selectedRequest.location}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={1}>Email</Text>
                        <Text>{selectedRequest.details.email}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={1}>Phone</Text>
                        <Text>{selectedRequest.details.phone}</Text>
                      </Box>
                      {selectedRequest.role === 'Farmer' && (
                        <>
                          <Box>
                            <Text fontWeight="bold" mb={1}>Farm Size</Text>
                            <Text>{selectedRequest.details.farmSize}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" mb={1}>Experience</Text>
                            <Text>{selectedRequest.details.experience}</Text>
                          </Box>
                        </>
                      )}
                      {selectedRequest.role === 'Investor' && (
                        <Box>
                          <Text fontWeight="bold" mb={1}>Investment Capacity</Text>
                          <Text>{selectedRequest.details.investmentCapacity}</Text>
                        </Box>
                      )}
                    </SimpleGrid>
                  </TabPanel>

                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Text fontWeight="bold">Submitted Documents</Text>
                      <SimpleGrid columns={2} spacing={4}>
                        {Object.entries(selectedRequest.documents).map(([key, url]) => (
                          <Box key={key}>
                            <Text fontSize="sm" mb={2} textTransform="capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Text>
                            <Image 
                              src={url} 
                              alt={key}
                              borderRadius="md"
                              border="1px solid"
                              borderColor="gray.200"
                              cursor="pointer"
                              onClick={() => window.open(url, '_blank')}
                            />
                          </Box>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Verification Status</FormLabel>
                        <Select defaultValue={selectedRequest.status}>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Admin Notes</FormLabel>
                        <Textarea 
                          placeholder="Add verification notes or rejection reason..."
                          rows={4}
                        />
                      </FormControl>

                      {selectedRequest.status === 'Pending' && (
                        <HStack spacing={4} justify="flex-end">
                          <Button
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<FaTimes />}
                            onClick={() => handleRejectKYC(selectedRequest, 'Documents not clear')}
                            isLoading={isProcessing}
                          >
                            Reject
                          </Button>
                          <Button
                            colorScheme="green"
                            leftIcon={<FaCheck />}
                            onClick={() => handleApproveKYC(selectedRequest)}
                            isLoading={isProcessing}
                          >
                            Approve & Issue Credential
                          </Button>
                        </HStack>
                      )}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default KYCDashboard;