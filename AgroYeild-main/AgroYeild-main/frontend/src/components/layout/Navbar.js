import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  Text, 
  Link, 
  useColorModeValue,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useDisclosure,
  useColorMode,
  Stack,
  HStack,
  Badge
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { MoonIcon, SunIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { FaEthereum, FaShieldAlt, FaSeedling, FaMoneyBillWave } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';

const NavLink = ({ children, to }) => (
  <Link
    as={RouterLink}
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    to={to}
  >
    {children}
  </Link>
);

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const { 
    isAuthenticated,
    user,
    logout,
    isConnected: authWalletConnected,
    walletAddress: authWalletAddress,
    connectWallet
  } = useAuth();
  
  const { 
    account, 
    isConnected: web3Connected, 
    disconnectWallet 
  } = useWeb3();
  
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user) {
      // Admin check - you can modify this logic based on your requirements
      const adminEmails = ['admin@agroyield.com', 'validator@agroyield.com'];
      const isUserAdmin = adminEmails.includes(user.email) || 
                         (user.roles && user.roles.includes('admin')) ||
                         (user.roles && user.roles.includes('validator'));
      setIsAdmin(isUserAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const getNavigationLinks = () => {
    if (!isAuthenticated) {
      return [
        { name: 'Home', path: '/' },
        { name: 'Projects', path: '/projects' }
      ];
    }

    const baseLinks = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Projects', path: '/projects' },
      { name: 'Governance', path: '/governance' }
    ];

    // Add role-specific links
    if (user?.roles?.includes('farmer')) {
      baseLinks.push({ name: 'Create Project', path: '/create-project' });
    }

    if (isAdmin) {
      baseLinks.push({ 
        name: 'Admin Panel', 
        path: '/admin', 
        admin: true 
      });
    }
    
    return baseLinks;
  };

  const Links = getNavigationLinks();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleLogout = () => {
    logout();
    if (web3Connected) {
      disconnectWallet();
    }
    navigate('/');
  };

  const displayAddress = authWalletAddress || account;
  const walletConnected = authWalletConnected || web3Connected;

  const getRoleBadge = () => {
    if (!user) return null;
    
    const roleConfig = {
      farmer: { color: 'green', icon: FaSeedling, label: 'Farmer' },
      investor: { color: 'blue', icon: FaMoneyBillWave, label: 'Investor' },
      admin: { color: 'purple', icon: FaShieldAlt, label: 'Admin' }
    };
    
    // Check for admin in roles array first
    if (user.roles?.includes('admin') || user.email === 'admin@agroyield.com') {
      return (
        <Badge colorScheme="purple" size="sm" ml={2}>
          Admin
        </Badge>
      );
    }
    
    // Fall back to regular role
    const config = roleConfig[user.role] || roleConfig.investor;
    
    return (
      <Badge colorScheme={config.color} size="sm" ml={2}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <IconButton
          size={'md'}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={'Open Menu'}
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
        />
        
        <HStack spacing={8} alignItems={'center'}>
          <Box display="flex" alignItems="center">
            <FaEthereum size={24} />
            <Text fontSize="xl" fontWeight="bold" ml={2}>
              AgroYield
            </Text>
          </Box>
          <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
            {Links.map((link) => (
              <NavLink key={link.name} to={link.path}>
                {link.name}
                {link.admin && (
                  <Badge ml={1} colorScheme="purple" size="sm">
                    Admin
                  </Badge>
                )}
              </NavLink>
            ))}
          </HStack>
        </HStack>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={4} align="center">
            <Button onClick={toggleColorMode}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>
            
            {isAuthenticated ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                >
                  <HStack spacing={2}>
                    <Avatar
                      size={'sm'}
                      name={user?.profile?.name || user?.email}
                      src={user?.profile?.profilePicture}
                    />
                    <Box display={{ base: 'none', md: 'flex' }} flexDirection="column" alignItems="flex-start">
                      <HStack spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {user?.profile?.name || formatAddress(displayAddress)}
                        </Text>
                        {getRoleBadge()}
                      </HStack>
                      {walletConnected && (
                        <Text fontSize="xs" color="gray.500" fontFamily="mono">
                          {formatAddress(displayAddress)}
                        </Text>
                      )}
                    </Box>
                  </HStack>
                </MenuButton>
                <MenuList zIndex={9999}>
                  <MenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/profile')}>
                    Profile
                  </MenuItem>
                  
                  {!user?.isKYCVerified && (
                    <MenuItem onClick={() => navigate('/kyc')}>
                      Complete KYC
                    </MenuItem>
                  )}
                  
                  {user?.roles?.includes('farmer') && (
                    <MenuItem onClick={() => navigate('/create-project')}>
                      Create Project
                    </MenuItem>
                  )}
                  
                  {isAdmin && (
                    <>
                      <MenuDivider />
                      <MenuItem onClick={() => navigate('/admin')}>
                        <HStack>
                          <FaShieldAlt />
                          <Text>Admin Panel</Text>
                        </HStack>
                      </MenuItem>
                      <MenuItem onClick={() => navigate('/admin/kyc')}>
                        <HStack>
                          <FaShieldAlt />
                          <Text>KYC Management</Text>
                        </HStack>
                      </MenuItem>
                    </>
                  )}
                  
                  <MenuDivider />
                  
                  {!walletConnected && (
                    <MenuItem onClick={connectWallet}>
                      Connect Wallet
                    </MenuItem>
                  )}
                  
                  <MenuItem onClick={handleLogout} color="red.500">
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <HStack spacing={3}>
                {walletConnected && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FaEthereum />}
                  >
                    {formatAddress(displayAddress)}
                  </Button>
                )}
                <Button
                  as={RouterLink}
                  to="/auth"
                  colorScheme="teal"
                  size="sm"
                >
                  Sign In
                </Button>
              </HStack>
            )}
          </Stack>
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as={'nav'} spacing={4}>
            {Links.map((link) => (
              <NavLink key={link.name} to={link.path} onClick={onClose}>
                {link.name}
                {link.admin && (
                  <Badge ml={1} colorScheme="purple" size="sm">
                    Admin
                  </Badge>
                )}
              </NavLink>
            ))}
            
            {!isAuthenticated && (
              <Button
                as={RouterLink}
                to="/auth"
                colorScheme="teal"
                size="sm"
                onClick={onClose}
              >
                Sign In
              </Button>
            )}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default Navbar;