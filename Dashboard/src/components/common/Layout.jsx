// src/components/common/Layout.jsx
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Storage as StorageIcon,
  Chat as ChatIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const drawerWidth = 240;

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Quản lý ảnh', href: '/images', icon: ImageIcon },
  { name: 'Quản lý dữ liệu', href: '/data-files', icon: StorageIcon },
  { name: 'Dịch vụ', href: '/services', icon: DashboardIcon },
  { name: 'Báo cáo', href: '/analytics', icon: BarChartIcon },
  { name: 'Hồ sơ', href: '/profile', icon: PersonIcon },
];

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const SidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            fontFamily: 'monospace'
          }}
        >
          QBot Admin
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const IconComponent = item.icon;
          
          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                  '&.active': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  minWidth: 40 
                }}>
                  <IconComponent />
                </ListItemIcon>
                <ListItemText 
                  primary={item.name}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Business Info */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            textAlign: 'center'
          }}
        >
          <Typography
            variant="body2"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            {user?.businessInfo?.businessName || 'Doanh nghiệp'}
          </Typography>
          <Badge
            badgeContent={user?.businessInfo?.businessType || 'Hoạt động'}
            color="success"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 'auto',
                padding: '2px 6px',
                borderRadius: '12px'
              }
            }}
          >
            <Box />
          </Badge>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile Logo */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              display: { xs: 'block', md: 'none' },
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              fontFamily: 'monospace'
            }}
          >
            ServiceHub
          </Typography>

          {/* Desktop spacer */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

          {/* Right side icons */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ p: 0, ml: 2 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.9rem'
                }}
              >
                {user?.businessInfo?.businessName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              onClick={handleProfileMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  minWidth: 200,
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {user?.businessInfo?.businessName || 'Người dùng'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              
              <MenuItem onClick={handleProfileMenuClose}>
                <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
                Cài đặt
              </MenuItem>
              
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                Đăng xuất
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <SidebarContent />
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          <SidebarContent />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh'
        }}
      >
        <Toolbar /> {/* This creates space for the fixed AppBar */}
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;