import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Button, 
  Avatar, 
  Badge, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Progress,
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
  Input,
  Textarea,
  useToast,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Wrap,
  WrapItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  Editable,
  EditableInput,
  EditableTextarea,
  EditablePreview,
  useEditableControls,
  ButtonGroup,
  Flex,
  IconButton as ChakraIconButton,
  Spacer
} from '@chakra-ui/react';
import { 
  FaUser, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaLink, 
  FaTwitter, 
  FaGithub, 
  FaLinkedin, 
  FaGlobe, 
  FaEllipsisV, 
  FaCheckCircle, 
  FaClock, 
  FaCheck, 
  FaMapMarkerAlt, 
  FaExternalLinkAlt,
  FaUserCog,
  FaBell,
  FaShieldAlt,
  FaLock,
  FaSignOutAlt,
  FaWallet
} from 'react-icons/fa';

// Mock data
const mockProfile = {
  name: 'John Doe',
  role: 'Farmer',
  address: '0x1234...5678',
  bio: 'Sustainable farmer with 10+ years of experience in organic agriculture. Passionate about regenerative farming practices and community development.',
  location: 'Rangpur, Bangladesh',
  email: 'john.doe@example.com',
  phone: '+880 1XXX XXXXXX',
  social: {
    twitter: 'johndoe',
    linkedin: 'in/johndoe',
    website: 'johndoefarms.com'
  },
  stats: {
    projects: 3,
    investments: 5,
    totalInvested: '৳125,000',
    totalEarned: '৳28,500',
    verified: true,
    kycStatus: 'Verified',
    memberSince: 'Jan 2022'
  },
  projects: [
    { id: 1, name: 'Organic Rice Farming', status: 'Active', invested: '৳50,000', returns: '৳12,500', progress: 65 },
    { id: 2, name: 'Mango Orchard', status: 'Completed', invested: '৳50,000', returns: '৳15,000', progress: 100 },
    { id: 3, name: 'Vegetable Farm', status: 'Active', invested: '৳25,000', returns: '৳1,000', progress: 20 }
  ],
  transactions: [
    { id: 1, type: 'Investment', amount: '৳50,000', project: 'Organic Rice Farming', date: '2023-05-15', status: 'Completed' },
    { id: 2, type: 'Payout', amount: '৳12,500', project: 'Mango Orchard', date: '2023-04-28', status: 'Completed' },
    { id: 3, type: 'Investment', amount: '৳25,000', project: 'Vegetable Farm', date: '2023-06-01', status: 'Completed' }
  ]
};

const Profile = () => {
  const [profile, setProfile] = useState(mockProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState({
    email: true,
    investmentUpdates: true,
    projectMilestones: true,
    governance: false,
    marketing: false
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColorLight = useColorModeValue('gray.100', 'gray.600');
  
  const [tempProfile, setTempProfile] = useState({ ...mockProfile });

  const handleEditClick = () => {
    setTempProfile({ ...profile });
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile({ ...tempProfile });
    setIsEditing(false);
    toast({
      title: 'Profile updated',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleCancel = () => {
    setTempProfile({ ...profile });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempProfile({
      ...tempProfile,
      [name]: value
    });
  };

  const handleSocialChange = (platform, value) => {
    setTempProfile({
      ...tempProfile,
      social: {
        ...tempProfile.social,
        [platform]: value
      }
    });
  };

  const handleNotificationChange = (key) => (e) => {
    setNotifications({
      ...notifications,
      [key]: e.target.checked
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const EditableControls = () => {
    const {
      isEditing,
      getSubmitButtonProps,
      getCancelButtonProps,
      getEditButtonProps,
    } = useEditableControls();

    return isEditing ? (
      <ButtonGroup justifyContent='center' size='sm' mt={2}>
        <IconButton 
          icon={<FaSave />} 
          colorScheme='green' 
          {...getSubmitButtonProps()} 
          aria-label='Save'
        />
        <IconButton 
          icon={<FaTimes />} 
          colorScheme='red' 
          variant='outline' 
          {...getCancelButtonProps()} 
          aria-label='Cancel'
        />
      </ButtonGroup>
    ) : (
      <Flex justifyContent='center' mt={2}>
        <IconButton 
          size='sm' 
          icon={<FaEdit />} 
          {...getEditButtonProps()} 
          aria-label='Edit'
        />
      </Flex>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab profile={isEditing ? tempProfile : profile} isEditing={isEditing} onInputChange={handleInputChange} onSocialChange={handleSocialChange} />;
      case 'projects':
        return <ProjectsTab projects={profile.projects} />;
      case 'transactions':
        return <TransactionsTab transactions={profile.transactions} />;
      case 'settings':
        return <SettingsTab notifications={notifications} onNotificationChange={handleNotificationChange} />;
      default:
        return <OverviewTab profile={isEditing ? tempProfile : profile} isEditing={isEditing} onInputChange={handleInputChange} onSocialChange={handleSocialChange} />;
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Profile Header */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <CardHeader>
            <HStack justify="space-between" align="flex-start">
              <HStack spacing={6}>
                <Box position="relative">
                  <Avatar 
                    size="2xl" 
                    name={profile.name} 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"
                    borderWidth={4}
                    borderColor={borderColorLight}
                  />
                  {profile.stats.verified && (
                    <Badge 
                      colorScheme="blue" 
                      position="absolute" 
                      bottom={2} 
                      right={2} 
                      borderRadius="full" 
                      p={1}
                      borderWidth={2}
                      borderColor={cardBg}
                    >
                      <FaCheck />
                    </Badge>
                  )}
                </Box>
                <Box>
                  <HStack align="center" spacing={4}>
                    <Heading size="lg">
                      {isEditing ? (
                        <Input 
                          name="name" 
                          value={tempProfile.name} 
                          onChange={handleInputChange}
                          variant="flushed"
                          size="lg"
                          fontWeight="bold"
                        />
                      ) : (
                        profile.name
                      )}
                    </Heading>
                    <Badge colorScheme="green" fontSize="0.8em" px={2} py={1}>
                      {profile.role}
                    </Badge>
                  </HStack>
                  
                  <HStack mt={2} color={textColor}>
                    <FaMapMarkerAlt />
                    {isEditing ? (
                      <Input 
                        name="location" 
                        value={tempProfile.location} 
                        onChange={handleInputChange}
                        variant="flushed"
                        size="sm"
                        px={2}
                      />
                    ) : (
                      <Text>{profile.location}</Text>
                    )}
                  </HStack>
                  
                  <HStack mt={4} spacing={3}>
                    <Tooltip label="Copy wallet address">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        leftIcon={<FaWallet />}
                        onClick={() => copyToClipboard(profile.address)}
                      >
                        {profile.address}
                      </Button>
                    </Tooltip>
                    
                    <Tooltip label="View on explorer">
                      <IconButton 
                        icon={<FaExternalLinkAlt />} 
                        size="sm" 
                        variant="ghost" 
                        aria-label="View on explorer"
                        onClick={() => window.open(`https://mumbai.polygonscan.com/address/${profile.address}`, '_blank')}
                      />
                    </Tooltip>
                  </HStack>
                </Box>
              </HStack>
              
              <HStack>
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button colorScheme="brand" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button leftIcon={<FaEdit />} onClick={handleEditClick}>
                    Edit Profile
                  </Button>
                )}
              </HStack>
            </HStack>
          </CardHeader>
          
          <CardBody pt={0}>
            <Tabs variant="enclosed" colorScheme="brand">
              <TabList>
                <Tab>Overview</Tab>
                <Tab>My Projects</Tab>
                <Tab>Transactions</Tab>
                <Tab>Settings</Tab>
              </TabList>
              
              <Box p={6}>
                {renderTabContent()}
              </Box>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

// Tab Components
const OverviewTab = ({ profile, isEditing, onInputChange, onSocialChange }) => {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <VStack spacing={6} align="stretch">
      {/* Bio Section */}
      <Card variant="outline" borderColor={borderColor}>
        <CardHeader pb={0}>
          <Heading size="md">About</Heading>
        </CardHeader>
        <CardBody>
          {isEditing ? (
            <Textarea
              name="bio"
              value={profile.bio}
              onChange={onInputChange}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          ) : (
            <Text whiteSpace="pre-line">{profile.bio}</Text>
          )}
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={6}>
            <Box>
              <Text fontSize="sm" color={textColor} mb={1}>
                Email
              </Text>
              {isEditing ? (
                <Input 
                  name="email" 
                  value={profile.email} 
                  onChange={onInputChange}
                  size="sm"
                />
              ) : (
                <Text fontWeight="medium">{profile.email}</Text>
              )}
            </Box>
            
            <Box>
              <Text fontSize="sm" color={textColor} mb={1}>
                Phone
              </Text>
              {isEditing ? (
                <Input 
                  name="phone" 
                  value={profile.phone} 
                  onChange={onInputChange}
                  size="sm"
                />
              ) : (
                <Text fontWeight="medium">{profile.phone}</Text>
              )}
            </Box>
          </SimpleGrid>
          
          <Box mt={6}>
            <Text fontSize="sm" color={textColor} mb={2}>
              Social Links
            </Text>
            <HStack spacing={4}>
              <Tooltip label="Twitter">
                <HStack>
                  <Box color="#1DA1F2">
                    <FaTwitter size={20} />
                  </Box>
                  {isEditing ? (
                    <Input 
                      value={profile.social.twitter} 
                      onChange={(e) => onSocialChange('twitter', e.target.value)}
                      size="sm"
                      placeholder="username"
                      w="150px"
                    />
                  ) : (
                    <Text>@{profile.social.twitter}</Text>
                  )}
                </HStack>
              </Tooltip>
              
              <Tooltip label="LinkedIn">
                <HStack>
                  <Box color="#0077B5">
                    <FaLinkedin size={20} />
                  </Box>
                  {isEditing ? (
                    <Input 
                      value={profile.social.linkedin} 
                      onChange={(e) => onSocialChange('linkedin', e.target.value)}
                      size="sm"
                      placeholder="username"
                      w="150px"
                    />
                  ) : (
                    <Text>in/{profile.social.linkedin}</Text>
                  )}
                </HStack>
              </Tooltip>
              
              <Tooltip label="Website">
                <HStack>
                  <Box>
                    <FaGlobe size={20} />
                  </Box>
                  {isEditing ? (
                    <Input 
                      value={profile.social.website} 
                      onChange={(e) => onSocialChange('website', e.target.value)}
                      size="sm"
                      placeholder="example.com"
                      w="150px"
                    />
                  ) : (
                    <Text>{profile.social.website}</Text>
                  )}
                </HStack>
              </Tooltip>
            </HStack>
          </Box>
        </CardBody>
      </Card>
      
      {/* Stats Section */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StatCard 
          title="Total Projects" 
          value={profile.stats.projects.toString()} 
          change="+2 this month" 
          icon={FaLink}
        />
        <StatCard 
          title="Total Invested" 
          value={profile.stats.totalInvested} 
          change="+৳25,000 this month" 
          icon={FaWallet}
        />
        <StatCard 
          title="Total Returns" 
          value={profile.stats.totalEarned} 
          change="+৳3,500 this month" 
          icon={FaWallet}
        />
      </SimpleGrid>
    </VStack>
  );
};

const ProjectsTab = ({ projects }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <VStack spacing={4} align="stretch">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Project</Th>
            <Th>Status</Th>
            <Th isNumeric>Invested</Th>
            <Th isNumeric>Returns</Th>
            <Th>Progress</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {projects.map((project) => (
            <Tr key={project.id}>
              <Td fontWeight="medium">{project.name}</Td>
              <Td>
                <Badge 
                  colorScheme={project.status === 'Active' ? 'green' : 'gray'}
                  variant="subtle"
                >
                  {project.status}
                </Badge>
              </Td>
              <Td isNumeric>{project.invested}</Td>
              <Td isNumeric color="green.500" fontWeight="bold">
                {project.returns}
              </Td>
              <Td>
                <HStack>
                  <Progress 
                    value={project.progress} 
                    size="sm" 
                    width="100px" 
                    colorScheme={project.progress === 100 ? 'green' : 'blue'}
                    borderRadius="full"
                  />
                  <Text fontSize="sm">{project.progress}%</Text>
                </HStack>
              </Td>
              <Td>
                <Button size="sm" variant="outline">View Details</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
};

const TransactionsTab = ({ transactions }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <VStack spacing={4} align="stretch">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Transaction ID</Th>
            <Th>Type</Th>
            <Th>Amount</Th>
            <Th>Project</Th>
            <Th>Date</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {transactions.map((tx) => (
            <Tr key={tx.id}>
              <Td>TX-{tx.id.toString().padStart(4, '0')}</Td>
              <Td>
                <Badge 
                  colorScheme={tx.type === 'Payout' ? 'green' : 'blue'}
                  variant="subtle"
                >
                  {tx.type}
                </Badge>
              </Td>
              <Td fontWeight="bold">{tx.amount}</Td>
              <Td>{tx.project}</Td>
              <Td>{tx.date}</Td>
              <Td>
                <Badge 
                  colorScheme={tx.status === 'Completed' ? 'green' : 'yellow'}
                  variant="subtle"
                >
                  {tx.status}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
};

const SettingsTab = ({ notifications, onNotificationChange }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <VStack spacing={6} align="stretch">
      <Card variant="outline" borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">Notification Preferences</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="medium">Email Notifications</Text>
                <Text fontSize="sm" color={textColor}>
                  Receive email notifications
                </Text>
              </Box>
              <Switch 
                isChecked={notifications.email} 
                onChange={onNotificationChange('email')} 
                colorScheme="brand"
              />
            </HStack>
            
            <Divider />
            
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="medium">Investment Updates</Text>
                <Text fontSize="sm" color={textColor}>
                  Get updates about your investments
                </Text>
              </Box>
              <Switch 
                isChecked={notifications.investmentUpdates} 
                onChange={onNotificationChange('investmentUpdates')} 
                colorScheme="brand"
              />
            </HStack>
            
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="medium">Project Milestones</Text>
                <Text fontSize="sm" color={textColor}>
                  Notify me when projects reach milestones
                </Text>
              </Box>
              <Switch 
                isChecked={notifications.projectMilestones} 
                onChange={onNotificationChange('projectMilestones')} 
                colorScheme="brand"
              />
            </HStack>
            
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="medium">Governance Proposals</Text>
                <Text fontSize="sm" color={textColor}>
                  Notify me about new governance proposals
                </Text>
              </Box>
              <Switch 
                isChecked={notifications.governance} 
                onChange={onNotificationChange('governance')} 
                colorScheme="brand"
              />
            </HStack>
            
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="medium">Marketing Emails</Text>
                <Text fontSize="sm" color={textColor}>
                  Receive marketing and promotional emails
                </Text>
              </Box>
              <Switch 
                isChecked={notifications.marketing} 
                onChange={onNotificationChange('marketing')} 
                colorScheme="brand"
              />
            </HStack>
          </VStack>
        </CardBody>
      </Card>
      
      <Card variant="outline" borderColor="red.200">
        <CardHeader>
          <Heading size="md" color="red.500">Danger Zone</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="medium">Delete Account</Text>
                <Text fontSize="sm" color={textColor}>
                  Permanently delete your account and all associated data
                </Text>
              </Box>
              <Button colorScheme="red" variant="outline">
                Delete Account
              </Button>
            </HStack>
            
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="medium">Export Data</Text>
                <Text fontSize="sm" color={textColor}>
                  Download all your data in a portable format
                </Text>
              </Box>
              <Button variant="outline">
                Export Data
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

// Reusable Components
const StatCard = ({ title, value, change, icon: Icon, colorScheme = 'brand' }) => {
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <Card variant="outline" borderColor={borderColor} bg={cardBg}>
      <CardBody>
        <HStack justify="space-between">
          <Box>
            <Text fontSize="sm" color={textColor} mb={1}>
              {title}
            </Text>
            <Heading size="lg" mb={1}>
              {value}
            </Heading>
            <Text fontSize="sm" color={secondaryTextColor}>
              {change}
            </Text>
          </Box>
          <Box 
            p={3} 
            bg={`${colorScheme}.50`} 
            color={`${colorScheme}.600`} 
            borderRadius="full"
          >
            <Icon size={20} />
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );
};

export default Profile;
