import React from 'react';
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
import { FaEthereum } from 'react-icons/fa';
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
console.log("Navbar rendered")
const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { account, isConnected, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const Links = [
    { name: 'Projects', path: '/projects' },
    { name: 'Governance', path: '/governance' },
    { name: 'Create Project', path: '/create-project' },
  ];

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
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
              </NavLink>
            ))}
          </HStack>
        </HStack>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={4} align="center">
            <Button onClick={toggleColorMode}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>
            
            {isConnected ? (
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
                      name={account}
                      src={`https://avatars.dicebear.com/api/identicon/${account}.svg`}
                    />
                    <Text display={{ base: 'none', md: 'flex' }}>
                      {formatAddress(account)}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList zIndex={9999}>
                  <MenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/profile')}>
                    Profile
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem>Disconnect</MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                colorScheme="teal"
                onClick={connectWallet}
                isLoading={false}
                loadingText="Connecting..."
              >
                Connect Wallet
              </Button>
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
              </NavLink>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default Navbar;
