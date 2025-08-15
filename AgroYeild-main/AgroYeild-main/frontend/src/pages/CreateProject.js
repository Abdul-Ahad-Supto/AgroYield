import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Image,
  Text, 
  FormControl, 
  FormLabel, 
  Input, 
  Textarea, 
  Select, 
  Button, 
  VStack, 
  HStack, 
  SimpleGrid, 
  NumberInput, 
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  useColorModeValue,
  FormHelperText,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Icon,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  Stepper,
  Flex,
} from '@chakra-ui/react';
import { FaUpload, FaCheck, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { useContracts } from '../hooks/useContracts'; // Fixed import path
import { useWeb3 } from '../contexts/Web3Context.Backup'; // Fixed import path

const steps = [
  { title: 'Basic Info', description: 'Project details' },
  { title: 'Funding', description: 'Financials' },
  { title: 'Timeline', description: 'Project phases' },
  { title: 'Review', description: 'Confirm details' },
];

function StepCircle({ isCompleted, isActive, stepIndex, ...props }) {
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      w={8}
      h={8}
      borderRadius="full"
      bg={isCompleted ? 'brand.500' : isActive ? 'brand.500' : 'gray.200'}
      color={isCompleted || isActive ? 'white' : 'gray.600'}
      fontWeight="bold"
      {...props}
    >
      {isCompleted ? <Icon as={FaCheck} boxSize={4} /> : stepIndex + 1}
    </Flex>
  );
}

const CreateProject = () => {
  const { isConnected } = useWeb3(); // Fixed hook usage
  const { createProject, loading } = useContracts();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    category: '',
    location: '',
    description: '',
    image: null,
    
    // Step 2: Funding
    targetAmount: '',
    fundingDeadline: '',
    
    // Step 3: Timeline
    milestones: [
      { name: 'Initial Setup', description: '', deadline: '' },
      { name: 'Planting', description: '', deadline: '' },
      { name: 'Growth', description: '', deadline: '' },
      { name: 'Harvest', description: '', deadline: '' },
    ],
    
    // Step 4: Risks & Rewards
    risks: '',
    rewards: '',
  });
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleMilestoneChange = (index, field, value) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      milestones: updatedMilestones,
    });
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: URL.createObjectURL(file),
      });
    }
  };
  
  const validateForm = () => {
    if (!formData.title) {
      toast({
        title: 'Missing Information',
        description: 'Project title is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    
    if (!formData.description) {
      toast({
        title: 'Missing Information',
        description: 'Project description is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    
    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid target amount.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    
    if (!formData.location) {
      toast({
        title: 'Missing Information',
        description: 'Project location is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    
    if (!formData.category) {
      toast({
        title: 'Missing Information',
        description: 'Project category is required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a project.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const result = await createProject({
        title: formData.title,
        description: formData.description,
        targetAmount: formData.targetAmount,
        location: formData.location,
        category: formData.category,
        duration: 90, // Default 90 days
        ipfsHash: 'QmDefault' // In a real app, upload to IPFS first
      });

      console.log('Project created:', result);
      
      // Reset form after successful creation
      setFormData({
        title: '',
        category: '',
        location: '',
        description: '',
        image: null,
        targetAmount: '',
        fundingDeadline: '',
        milestones: [
          { name: 'Initial Setup', description: '', deadline: '' },
          { name: 'Planting', description: '', deadline: '' },
          { name: 'Growth', description: '', deadline: '' },
          { name: 'Harvest', description: '', deadline: '' },
        ],
        risks: '',
        rewards: '',
      });
      
      setCurrentStep(0);

    } catch (error) {
      console.error('Project creation failed:', error);
      toast({
        title: 'Project Creation Failed',
        description: error.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel>Project Title</FormLabel>
              <Input 
                type="text" 
                name="title" 
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Organic Rice Farming in Rangpur"
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select 
                name="category" 
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Select category"
              >
                <option value="Rice Cultivation">Rice Cultivation</option>
                <option value="Fruit Cultivation">Fruit Cultivation</option>
                <option value="Vegetable Cultivation">Vegetable Cultivation</option>
                <option value="Livestock">Livestock</option>
                <option value="Fisheries">Fisheries</option>
                <option value="Agroforestry">Agroforestry</option>
              </Select>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Location</FormLabel>
              <Input 
                type="text" 
                name="location" 
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Rangpur Division, Bangladesh"
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Project Description</FormLabel>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your project, farming methods, and goals..."
                rows={6}
              />
              <FormHelperText>
                Be detailed about your farming practices, experience, and what makes your project unique.
              </FormHelperText>
            </FormControl>
            
            <FormControl>
              <FormLabel>Project Image</FormLabel>
              <Box
                borderWidth={2}
                borderStyle="dashed"
                borderColor={borderColor}
                borderRadius="md"
                p={8}
                textAlign="center"
                cursor="pointer"
                _hover={{ borderColor: "brand.500" }}
              >
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  display="none"
                  id="project-image-upload"
                />
                <label htmlFor="project-image-upload" style={{ cursor: 'pointer' }}>
                  <VStack spacing={2}>
                    <Icon as={FaUpload} boxSize={8} color="gray.500" />
                    <Text>Click to upload an image or drag and drop</Text>
                    <Text fontSize="sm" color="gray.500">PNG, JPG, GIF up to 5MB</Text>
                  </VStack>
                </label>
              </Box>
              {formData.image && (
                <Box mt={4} boxSize="200px" borderRadius="md" overflow="hidden">
                  <Image 
                    src={formData.image} 
                    alt="Project preview" 
                    objectFit="cover"
                    width="100%"
                    height="100%"
                  />
                </Box>
              )}
            </FormControl>
          </VStack>
        );
        
      case 1:
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel>Funding Goal (BDT)</FormLabel>
              <NumberInput min={1000} precision={0}>
                <NumberInputField 
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  placeholder="e.g., 50000"
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>
                How much funding do you need to complete this project? (Minimum: 1,000 BDT)
              </FormHelperText>
            </FormControl>
            
            <FormControl>
              <FormLabel>Funding Deadline</FormLabel>
              <Input
                type="date"
                name="fundingDeadline"
                value={formData.fundingDeadline}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
              <FormHelperText>
                When should this funding round end? (30-60 days recommended)
              </FormHelperText>
            </FormControl>
            
            <FormControl>
              <FormLabel>Risks and Challenges</FormLabel>
              <Textarea
                name="risks"
                value={formData.risks}
                onChange={handleInputChange}
                placeholder="What are the potential risks or challenges for this project?"
                rows={4}
              />
              <FormHelperText>
                Being transparent about risks helps build trust with potential investors.
              </FormHelperText>
            </FormControl>
          </VStack>
        );
        
      case 2:
        return (
          <VStack spacing={6} align="stretch">
            <Text fontSize="lg" fontWeight="medium" mb={4}>
              Define your project milestones and timeline:
            </Text>
            
            {formData.milestones.map((milestone, index) => (
              <Card key={index} variant="outline" borderColor={borderColor}>
                <CardHeader pb={2}>
                  <Heading size="md">{milestone.name}</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <FormControl mb={4}>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      placeholder={`What will be accomplished in the ${milestone.name.toLowerCase()} phase?`}
                      rows={3}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Target Completion Date</FormLabel>
                    <Input
                      type="date"
                      value={milestone.deadline}
                      onChange={(e) => handleMilestoneChange(index, 'deadline', e.target.value)}
                      min={index > 0 ? formData.milestones[index - 1]?.deadline || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                </CardBody>
              </Card>
            ))}
            
            <FormControl>
              <FormLabel>Rewards for Investors</FormLabel>
              <Textarea
                name="rewards"
                value={formData.rewards}
                onChange={handleInputChange}
                placeholder="What will investors receive in return? (e.g., profit share, products, etc.)"
                rows={4}
              />
            </FormControl>
          </VStack>
        );
        
      case 3:
        return (
          <VStack spacing={6} align="stretch">
            <Card variant="outline" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Project Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" fontSize="lg">{formData.title}</Text>
                    <Text color="gray.500">{formData.category} • {formData.location}</Text>
                  </Box>
                  
                  <Text>{formData.description}</Text>
                  
                  <Divider />
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontWeight="medium">Funding Goal</Text>
                      <Text>{formData.targetAmount ? `${formData.targetAmount} BDT` : 'Not set'}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="medium">Funding Deadline</Text>
                      <Text>{formData.fundingDeadline || 'Not set'}</Text>
                    </Box>
                  </SimpleGrid>
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="medium" mb={2}>Project Timeline</Text>
                    <VStack align="stretch" spacing={2}>
                      {formData.milestones.map((milestone, index) => (
                        <Box key={index} pl={4} borderLeftWidth="2px" borderColor="brand.500">
                          <Text fontWeight="medium">{milestone.name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {milestone.deadline || 'No date set'}
                          </Text>
                          {milestone.description && (
                            <Text fontSize="sm" mt={1}>{milestone.description}</Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                  
                  {formData.risks && (
                    <Box>
                      <Text fontWeight="medium">Risks & Challenges</Text>
                      <Text>{formData.risks}</Text>
                    </Box>
                  )}
                  
                  {formData.rewards && (
                    <Box>
                      <Text fontWeight="medium">Investor Rewards</Text>
                      <Text>{formData.rewards}</Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
            
            <Text color="gray.500" fontSize="sm">
              By submitting this project, you agree to our Terms of Service and acknowledge that your project 
              will need to be verified before being published on the platform.
            </Text>
          </VStack>
        );
        
      default:
        return null;
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Create a New Project
          </Heading>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Fill out the form below to submit your agricultural project for funding.
          </Text>
        </Box>
        
        {/* Progress Stepper */}
        <Stepper index={currentStep} colorScheme="brand" mb={8}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>
              <Box flexShrink='0'>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>
              <StepSeparator />
            </Step>
          ))}
        </Stepper>
        
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <CardBody p={{ base: 4, md: 8 }}>
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
              
              <HStack mt={12} spacing={4} justify={currentStep === 0 ? 'flex-end' : 'space-between'}>
                {currentStep > 0 && (
                  <Button
                    leftIcon={<FaArrowLeft />}
                    onClick={prevStep}
                    variant="outline"
                  >
                    Back
                  </Button>
                )}
                
                {currentStep < steps.length - 1 ? (
                  <Button
                    rightIcon={<FaArrowRight />}
                    colorScheme="brand"
                    onClick={nextStep}
                    ml="auto"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    colorScheme="green"
                    rightIcon={<FaCheck />}
                    ml="auto"
                    isLoading={loading}
                    loadingText="Creating Project..."
                    isDisabled={!isConnected}
                  >
                    Submit Project
                  </Button>
                )}
              </HStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default CreateProject;