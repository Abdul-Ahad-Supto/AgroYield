// frontend/src/pages/KYCForm.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Badge,
  Image,
  SimpleGrid,
  Divider,
  Checkbox,
  Textarea,
  Center,
  Spinner,
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
  useSteps
} from '@chakra-ui/react';
import {
  FaUpload,
  FaUser,
  FaIdCard,
  FaCamera,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const steps = [
  { title: 'Personal Info', description: 'Basic details' },
  { title: 'Documents', description: 'Upload documents' },
  { title: 'Role Selection', description: 'Choose your role' },
  { title: 'Review', description: 'Confirm submission' }
];

const KYCForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    nidNumber: '',
    phone: '',
    address: '',
    desiredRole: ''
  });
  const [files, setFiles] = useState({
    nidFront: null,
    nidBack: null,
    selfie: null
  });
  const [filePreview, setFilePreview] = useState({
    nidFront: null,
    nidBack: null,
    selfie: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [agreement, setAgreement] = useState(false);

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const { user, submitKYC, getKYCStatus, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Check authentication and KYC status
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const checkKYCStatus = async () => {
      try {
        const status = await getKYCStatus();
        setKycStatus(status);
      } catch (error) {
        console.error('Failed to get KYC status:', error);
      }
    };

    checkKYCStatus();
  }, [isAuthenticated, navigate, getKYCStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [fileType]: 'File size must be less than 5MB' }));
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, [fileType]: 'Please upload an image file' }));
        return;
      }

      setFiles(prev => ({ ...prev, [fileType]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(prev => ({ ...prev, [fileType]: e.target.result }));
      };
      reader.readAsDataURL(file);

      // Clear error
      if (errors[fileType]) {
        setErrors(prev => ({ ...prev, [fileType]: '' }));
      }
    }
  };

  const validateStep = () => {
    const newErrors = {};

    switch (activeStep) {
      case 0: // Personal Info
        if (!formData.name.trim()) newErrors.name = 'Full name is required';
        if (!formData.nidNumber.trim()) newErrors.nidNumber = 'NID number is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        break;

      case 1: // Documents
        if (!files.nidFront) newErrors.nidFront = 'NID front image is required';
        if (!files.nidBack) newErrors.nidBack = 'NID back image is required';
        if (!files.selfie) newErrors.selfie = 'Selfie is required';
        break;

      case 2: // Role Selection
        if (!formData.desiredRole) newErrors.desiredRole = 'Please select your role';
        break;

      case 3: // Review
        if (!agreement) newErrors.agreement = 'You must agree to the terms';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      await submitKYC(formData, files);
      
      // Refresh KYC status
      const newStatus = await getKYCStatus();
      setKycStatus(newStatus);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('KYC submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show status if KYC already submitted
  if (kycStatus && kycStatus.status !== 'not_submitted') {
    return (
      <Container maxW="2xl" py={8}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody p={8}>
            <VStack spacing={6} textAlign="center">
              <Icon 
                as={kycStatus.status === 'approved' ? FaCheck : 
                    kycStatus.status === 'rejected' ? FaTimes : FaInfoCircle} 
                boxSize={16} 
                color={kycStatus.status === 'approved' ? 'green.500' : 
                       kycStatus.status === 'rejected' ? 'red.500' : 'yellow.500'} 
              />
              
              <Heading size="lg">
                KYC {kycStatus.status === 'approved' ? 'Approved' : 
                     kycStatus.status === 'rejected' ? 'Rejected' : 'Under Review'}
              </Heading>
              
              <Text color="gray.600">
                {kycStatus.status === 'approved' && 'Your KYC has been approved. You can now use all platform features.'}
                {kycStatus.status === 'rejected' && 'Your KYC was rejected. Please contact support for more information.'}
                {kycStatus.status === 'pending' && 'Your KYC documents are being reviewed. This usually takes 1-2 business days.'}
              </Text>
              
              {kycStatus.notes && (
                <Alert status={kycStatus.status === 'rejected' ? 'error' : 'info'}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Admin Notes:</AlertTitle>
                    <AlertDescription>{kycStatus.notes}</AlertDescription>
                  </Box>
                </Alert>
              )}
              
              <Button colorScheme="brand" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <VStack spacing={4}>
            <FormControl isInvalid={errors.name}>
              <FormLabel>Full Name (as per NID)</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
              <FormErrorMessage>{errors.name}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.nidNumber}>
              <FormLabel>National ID Number</FormLabel>
              <Input
                name="nidNumber"
                value={formData.nidNumber}
                onChange={handleInputChange}
                placeholder="Enter your NID number"
              />
              <FormErrorMessage>{errors.nidNumber}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.phone}>
              <FormLabel>Phone Number</FormLabel>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+880 1XXX XXXXXX"
              />
              <FormErrorMessage>{errors.phone}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={errors.address}>
              <FormLabel>Address</FormLabel>
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your full address"
                rows={3}
              />
              <FormErrorMessage>{errors.address}</FormErrorMessage>
            </FormControl>
          </VStack>
        );

      case 1:
        return (
          <VStack spacing={6}>
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Document Requirements</AlertTitle>
                <AlertDescription>
                  Please upload clear, high-quality images. All text should be readable.
                </AlertDescription>
              </Box>
            </Alert>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
              {/* NID Front */}
              <DocumentUpload
                title="NID Front Side"
                icon={FaIdCard}
                file={files.nidFront}
                preview={filePreview.nidFront}
                error={errors.nidFront}
                onChange={(e) => handleFileChange(e, 'nidFront')}
              />

              {/* NID Back */}
              <DocumentUpload
                title="NID Back Side"
                icon={FaIdCard}
                file={files.nidBack}
                preview={filePreview.nidBack}
                error={errors.nidBack}
                onChange={(e) => handleFileChange(e, 'nidBack')}
              />

              {/* Selfie */}
              <Box gridColumn={{ base: '1', md: '1 / -1' }}>
                <DocumentUpload
                  title="Selfie with NID"
                  icon={FaCamera}
                  file={files.selfie}
                  preview={filePreview.selfie}
                  error={errors.selfie}
                  onChange={(e) => handleFileChange(e, 'selfie')}
                  description="Hold your NID next to your face"
                />
              </Box>
            </SimpleGrid>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={6}>
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Choose Your Role</AlertTitle>
                <AlertDescription>
                  Select what you want to do on AgroYield. You can change this later.
                </AlertDescription>
              </Box>
            </Alert>

            <FormControl isInvalid={errors.desiredRole}>
              <FormLabel>I want to be a:</FormLabel>
              <VStack spacing={3} align="stretch">
                <Card 
                  variant="outline" 
                  cursor="pointer"
                  onClick={() => setFormData(prev => ({ ...prev, desiredRole: 'farmer' }))}
                  bg={formData.desiredRole === 'farmer' ? 'brand.50' : 'transparent'}
                  borderColor={formData.desiredRole === 'farmer' ? 'brand.500' : borderColor}
                >
                  <CardBody p={4}>
                    <HStack>
                      <Icon as={FaUser} color="green.500" />
                      <Box>
                        <Text fontWeight="bold">Farmer</Text>
                        <Text fontSize="sm" color="gray.600">
                          Create projects and receive funding for agricultural ventures
                        </Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>

                <Card 
                  variant="outline" 
                  cursor="pointer"
                  onClick={() => setFormData(prev => ({ ...prev, desiredRole: 'investor' }))}
                  bg={formData.desiredRole === 'investor' ? 'brand.50' : 'transparent'}
                  borderColor={formData.desiredRole === 'investor' ? 'brand.500' : borderColor}
                >
                  <CardBody p={4}>
                    <HStack>
                      <Icon as={FaUser} color="blue.500" />
                      <Box>
                        <Text fontWeight="bold">Investor</Text>
                        <Text fontSize="sm" color="gray.600">
                          Invest in agricultural projects and earn returns
                        </Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>

                <Card 
                  variant="outline" 
                  cursor="pointer"
                  onClick={() => setFormData(prev => ({ ...prev, desiredRole: 'both' }))}
                  bg={formData.desiredRole === 'both' ? 'brand.50' : 'transparent'}
                  borderColor={formData.desiredRole === 'both' ? 'brand.500' : borderColor}
                >
                  <CardBody p={4}>
                    <HStack>
                      <Icon as={FaUser} color="purple.500" />
                      <Box>
                        <Text fontWeight="bold">Both</Text>
                        <Text fontSize="sm" color="gray.600">
                          Create projects and invest in others' projects
                        </Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>
              </VStack>
              <FormErrorMessage>{errors.desiredRole}</FormErrorMessage>
            </FormControl>
          </VStack>
        );

      case 3:
        return (
          <VStack spacing={6}>
            <Alert status="warning">
              <AlertIcon />
              <Box>
                <AlertTitle>Review Your Information</AlertTitle>
                <AlertDescription>
                  Please review all information before submitting. Changes may require resubmission.
                </AlertDescription>
              </Box>
            </Alert>

            {/* Review Summary */}
            <Card variant="outline" w="full">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Personal Information</Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Full Name</Text>
                      <Text fontWeight="bold">{formData.name}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">NID Number</Text>
                      <Text fontWeight="bold">{formData.nidNumber}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Phone</Text>
                      <Text fontWeight="bold">{formData.phone}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500">Role</Text>
                      <Badge colorScheme="brand" textTransform="capitalize">
                        {formData.desiredRole}
                      </Badge>
                    </Box>
                  </SimpleGrid>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Address</Text>
                    <Text fontWeight="bold">{formData.address}</Text>
                  </Box>
                  
                  <Divider />
                  
                  <Heading size="md">Documents</Heading>
                  <SimpleGrid columns={3} spacing={4}>
                    <Box textAlign="center">
                      <Text fontSize="sm" color="gray.500" mb={2}>NID Front</Text>
                      {filePreview.nidFront && (
                        <Image 
                          src={filePreview.nidFront} 
                          alt="NID Front" 
                          borderRadius="md"
                          maxH="100px"
                          objectFit="cover"
                        />
                      )}
                      <Badge colorScheme="green" mt={2}>Uploaded</Badge>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="sm" color="gray.500" mb={2}>NID Back</Text>
                      {filePreview.nidBack && (
                        <Image 
                          src={filePreview.nidBack} 
                          alt="NID Back" 
                          borderRadius="md"
                          maxH="100px"
                          objectFit="cover"
                        />
                      )}
                      <Badge colorScheme="green" mt={2}>Uploaded</Badge>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="sm" color="gray.500" mb={2}>Selfie</Text>
                      {filePreview.selfie && (
                        <Image 
                          src={filePreview.selfie} 
                          alt="Selfie" 
                          borderRadius="md"
                          maxH="100px"
                          objectFit="cover"
                        />
                      )}
                      <Badge colorScheme="green" mt={2}>Uploaded</Badge>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Terms Agreement */}
            <FormControl isInvalid={errors.agreement}>
              <Checkbox
                isChecked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
              >
                <Text fontSize="sm">
                  I agree to the{' '}
                  <Button variant="link" colorScheme="brand" fontSize="sm">
                    Terms of Service
                  </Button>{' '}
                  and{' '}
                  <Button variant="link" colorScheme="brand" fontSize="sm">
                    Privacy Policy
                  </Button>
                </Text>
              </Checkbox>
              <FormErrorMessage>{errors.agreement}</FormErrorMessage>
            </FormControl>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="4xl" py={8}>
        <VStack spacing={8}>
          {/* Header */}
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={2}>
              KYC Verification
            </Heading>
            <Text color="gray.600">
              Complete your verification to access all platform features
            </Text>
          </Box>

          {/* Progress Stepper */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} w="full">
            <CardBody p={6}>
              <Stepper index={activeStep} colorScheme="brand">
                {steps.map((step, index) => (
                  <Step key={index}>
                    <StepIndicator>
                      <StepStatus
                        complete={<StepIcon />}
                        incomplete={<StepNumber />}
                        active={<StepNumber />}
                      />
                    </StepIndicator>
                    <Box flexShrink="0">
                      <StepTitle>{step.title}</StepTitle>
                      <StepDescription>{step.description}</StepDescription>
                    </Box>
                    <StepSeparator />
                  </Step>
                ))}
              </Stepper>
            </CardBody>
          </Card>

          {/* Form Content */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} w="full">
            <CardHeader>
              <Heading size="md">{steps[activeStep].title}</Heading>
              <Text color="gray.600">{steps[activeStep].description}</Text>
            </CardHeader>
            <CardBody>
              {renderStepContent()}
            </CardBody>

            {/* Navigation Buttons */}
            <CardBody pt={0}>
              <HStack justify="space-between">
                <Button
                  onClick={handlePrevious}
                  isDisabled={activeStep === 0}
                  variant="outline"
                >
                  Previous
                </Button>

                {activeStep < steps.length - 1 ? (
                  <Button colorScheme="brand" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button
                    colorScheme="green"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    loadingText="Submitting..."
                    leftIcon={<FaCheck />}
                  >
                    Submit KYC
                  </Button>
                )}
              </HStack>
            </CardBody>
          </Card>

          {/* Help Text */}
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>Need Help?</AlertTitle>
              <AlertDescription>
                If you have any questions about the KYC process, please contact our support team.
              </AlertDescription>
            </Box>
          </Alert>
        </VStack>
      </Container>
    </Box>
  );
};

// Document Upload Component
const DocumentUpload = ({ title, icon, file, preview, error, onChange, description }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <VStack spacing={3}>
      <HStack>
        <Icon as={icon} />
        <Text fontWeight="medium">{title}</Text>
      </HStack>
      
      {description && (
        <Text fontSize="sm" color="gray.500" textAlign="center">
          {description}
        </Text>
      )}

      <Box
        borderWidth={2}
        borderStyle="dashed"
        borderColor={error ? "red.300" : borderColor}
        borderRadius="md"
        p={6}
        textAlign="center"
        cursor="pointer"
        _hover={{ borderColor: "brand.500" }}
        transition="border-color 0.2s"
        position="relative"
        w="full"
        minH="150px"
        bg={preview ? "transparent" : "gray.50"}
      >
        <Input
          type="file"
          accept="image/*"
          onChange={onChange}
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          opacity={0}
          cursor="pointer"
        />

        {preview ? (
          <Image
            src={preview}
            alt={title}
            maxH="120px"
            maxW="full"
            objectFit="contain"
            borderRadius="md"
          />
        ) : (
          <VStack spacing={2}>
            <Icon as={FaUpload} size="24px" color="gray.400" />
            <Text fontSize="sm" color="gray.500">
              Click to upload or drag and drop
            </Text>
            <Text fontSize="xs" color="gray.400">
              PNG, JPG up to 5MB
            </Text>
          </VStack>
        )}
      </Box>

      {file && (
        <Badge colorScheme="green" fontSize="xs">
          {file.name}
        </Badge>
      )}

      {error && (
        <Text color="red.500" fontSize="sm">
          {error}
        </Text>
      )}
    </VStack>
  );
};

export default KYCForm;