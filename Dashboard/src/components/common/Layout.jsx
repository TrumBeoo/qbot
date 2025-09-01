// src/components/common/Layout.jsx
import {
  Box,
  Flex,
  Avatar,
  HStack,
  VStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Text,
  Badge,
  Divider
} from '@chakra-ui/react';
import { HamburgerIcon, BellIcon, SettingsIcon, ChatIcon } from '@chakra-ui/icons';
import { FiHome, FiGrid, FiBarChart, FiUser, FiLogOut, FiMessageSquare } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Dịch vụ', href: '/services', icon: FiGrid },
  { name: 'Quản lý dữ liệu', href: '/data-management', icon: FiMessageSquare },
  { name: 'Báo cáo', href: '/analytics', icon: FiBarChart },
  { name: 'Hồ sơ', href: '/profile', icon: FiUser },
];

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = ({ onClose, ...rest }) => (
    <Box
      bg={bg}
      borderRight="1px"
      borderRightColor={borderColor}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold" color="blue.500">
          ServiceHub
        </Text>
      </Flex>
      
      <VStack align="stretch" spacing="1" px="4">
        {navItems.map((item) => (
          <Button
            key={item.name}
            as={NavLink}
            to={item.href}
            variant="ghost"
            justifyContent="flex-start"
            leftIcon={<Box as={item.icon} />}
            _activeLink={{
              bg: 'blue.50',
              color: 'blue.600',
              fontWeight: 'semibold'
            }}
            onClick={onClose}
          >
            {item.name}
          </Button>
        ))}
      </VStack>
      
      <Box position="absolute" bottom="4" left="4" right="4">
        <Divider mb="4" />
        <VStack spacing="2">
          <Box
            p="3"
            bg="blue.50"
            borderRadius="md"
            width="100%"
            textAlign="center"
          >
            <Text fontSize="sm" color="blue.600" fontWeight="semibold">
              {user?.businessInfo?.businessName || 'Doanh nghiệp'}
            </Text>
            <Badge colorScheme="green" fontSize="xs" mt="1">
              {user?.businessInfo?.businessType || 'Hoạt động'}
            </Badge>
          </Box>
        </VStack>
      </Box>
    </Box>
  );

  const MobileNav = ({ onOpen, ...rest }) => (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 8 }}
      height="20"
      alignItems="center"
      bg={bg}
      borderBottomWidth="1px"
      borderBottomColor={borderColor}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<HamburgerIcon />}
      />

      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
        color="blue.500"
      >
        ServiceHub
      </Text>

      <HStack spacing={{ base: '0', md: '6' }}>
        <IconButton
          size="lg"
          variant="ghost"
          aria-label="notifications"
          icon={<BellIcon />}
        />
        
        <Flex alignItems="center">
          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="link"
              cursor="pointer"
              minW={0}
            >
              <Avatar
                size="sm"
                name={user?.businessInfo?.businessName}
                bg="blue.500"
              />
            </MenuButton>
            <MenuList>
              <MenuItem>
                <VStack align="start" spacing="1">
                  <Text fontWeight="semibold">
                    {user?.businessInfo?.businessName}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {user?.email}
                  </Text>
                </VStack>
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<SettingsIcon />}>
                Cài đặt
              </MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Đăng xuất
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')}>
      <SidebarContent
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
      />
      
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      
      <MobileNav onOpen={onOpen} />
      
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
};

export default Layout;