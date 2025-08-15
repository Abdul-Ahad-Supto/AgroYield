import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text,
  SimpleGrid, 
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Divider
} from '@chakra-ui/react';
import { FaCheck, FaTimes, FaSearch, FaFileAlt, FaUserTie } from 'react-icons/fa';

const VerifyProject = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProject, setSelectedProject] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  // Mock data - in a real app, this would come from your smart contracts
  const [projects, setProjects] = useState([
    {
      id: 'PRJ-001',
      title: 'Organic Rice Farming',
      farmer: '0x1234...5678',
      submitted: '2023-06-10',
      status: 'Pending',
      documents: ['Land Deed', 'ID Proof', 'Business License'],
      details: {
        location: 'Rangpur Division, Bangladesh',
        targetAmount: '50000 BDT',
        description: 'Sustainable rice farming using organic methods',
        documents: {
          'Land Deed': 'doc1.pdf',
          'ID Proof': 'doc2.pdf',
          'Business License': 'doc3.pdf'
        }
      }
    },
    {
      id: 'PRJ-002',
      title: 'Mango Orchard Expansion',
      farmer: '0x8765...4321',
      submitted: '2023-06-05',
      status: 'In Review',
      documents: ['Land Ownership', 'Tax ID', 'Business Plan'],
      assignedTo: 'You',
      details: {
        location: 'Rajshahi, Bangladesh',
        targetAmount: '75000 BDT',
        description: 'Expanding existing mango orchard with modern irrigation',
        documents: {
          'Land Ownership': 'doc4.pdf',
          'Tax ID': 'doc5.pdf',
          'Business Plan': 'doc6.pdf'
        }
      }
    },
    {
      id: 'PRJ-003',
      title: 'Dairy Farm Modernization',
      farmer: '0x5678...1234',
      submitted: '2023-05-28',
      status: 'Verified',
      documents: ['Land Documents', 'Health Certificate', 'Business Registration'],
      verifiedBy: 'agent1',
      details: {
        location: 'Chittagong, Bangladesh',
        targetAmount: '100000 BDT',
        description: 'Upgrading dairy farm facilities and equipment',
        documents: {
          'Land Documents': 'doc7.pdf',
          'Health Certificate': 'doc8.pdf',
          'Business Registration': 'doc9.pdf'
        }
      }
    },
  ]);

  const handleReviewClick = (project) => {
    setSelectedProject(project);
    setVerificationNotes('');
    onOpen();
  };

  const handleApprove = () => {
    // In a real app, this would interact with your smart contract
    const updatedProjects = projects.map(p => 
      p.id === selectedProject.id ? { ...p, status: 'Verified', verifiedBy: 'You' } : p
    );
    setProjects(updatedProjects);
    
    toast({
      title: 'Project Verified',
      description: `Project ${selectedProject.id} has been approved.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    
    onClose();
  };

  const handleReject = () => {
    if (!verificationNotes) {
      toast({
        title: 'Notes Required',
        description: 'Please provide a reason for rejection.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // In a real app, this would interact with your smart contract
    const updatedProjects = projects.map(p => 
      p.id === selectedProject.id ? { 
        ...p, 
        status: 'Rejected',
        rejectionReason: verificationNotes,
        verifiedBy: 'You' 
      } : p
    );
    setProjects(updatedProjects);
    
    toast({
      title: 'Project Rejected',
      description: `Project ${selectedProject.id} has been rejected.`,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Verified':
        return 'green';
      case 'Rejected':
        return 'red';
      case 'In Review':
        return 'blue';
      default:
        return 'yellow';
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Project Verification
          </Heading>
          <Text color={textColor}>
            Review and verify new project submissions
          </Text>
        </Box>

        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} overflowX="auto">
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Projects Pending Verification</Heading>
              <HStack>
                <Button leftIcon={<FaSearch />} variant="outline" size="sm">
                  Filter
                </Button>
              </HStack>
            </HStack>
          </CardHeader>
          <Divider />
          <CardBody p={0}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Project ID</Th>
                  <Th>Title</Th>
                  <Th>Farmer</Th>
                  <Th>Submitted</Th>
                  <Th>Status</Th>
                  <Th>Documents</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {projects.map((project) => (
                  <Tr key={project.id}>
                    <Td fontWeight="medium">{project.id}</Td>
                    <Td>{project.title}</Td>
                    <Td fontFamily="mono">{project.farmer}</Td>
                    <Td>{project.submitted}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      {project.assignedTo && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Assigned to: {project.assignedTo}
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {project.documents.map((doc, idx) => (
                          <Button
                            key={idx}
                            leftIcon={<FaFileAlt />}
                            size="xs"
                            variant="outline"
                          >
                            {doc}
                          </Button>
                        ))}
                      </HStack>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          leftIcon={<FaSearch />}
                          onClick={() => handleReviewClick(project)}
                          colorScheme="blue"
                          variant="outline"
                        >
                          Review
                        </Button>
                        {project.status === 'In Review' && project.assignedTo === 'You' && (
                          <Button
                            size="sm"
                            leftIcon={<FaUserTie />}
                            colorScheme="purple"
                            variant="outline"
                          >
                            Assign to Me
                          </Button>
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

      {/* Verification Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Verify Project: {selectedProject?.id}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProject && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={2}>{selectedProject.title}</Heading>
                  <Text color="gray.500">{selectedProject.details.description}</Text>
                </Box>
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="medium">Farmer</Text>
                    <Text>{selectedProject.farmer}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium">Location</Text>
                    <Text>{selectedProject.details.location}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium">Funding Goal</Text>
                    <Text>{selectedProject.details.targetAmount}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedProject.status)}>
                      {selectedProject.status}
                    </Badge>
                  </Box>
                </SimpleGrid>
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Documents</Text>
                  <VStack align="stretch" spacing={2}>
                    {Object.entries(selectedProject.details.documents).map(([name, file]) => (
                      <Button
                        key={name}
                        leftIcon={<FaFileAlt />}
                        variant="outline"
                        justifyContent="flex-start"
                      >
                        {name}: {file}
                      </Button>
                    ))}
                  </VStack>
                </Box>
                
                <FormControl>
                  <FormLabel>Verification Notes</FormLabel>
                  <Textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add notes about your verification process..."
                    rows={4}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Required if rejecting the project
                  </Text>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                leftIcon={<FaTimes />}
                onClick={handleReject}
                isDisabled={selectedProject?.status === 'Verified'}
              >
                Reject
              </Button>
              <Button 
                colorScheme="green" 
                leftIcon={<FaCheck />}
                onClick={handleApprove}
                isDisabled={selectedProject?.status === 'Verified'}
              >
                Approve
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default VerifyProject;
