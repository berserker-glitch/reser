import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Container,
  Paper,
  useTheme,
  useMediaQuery,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  Home,
  History,
  CalendarToday,
  Menu as MenuIcon,
  Add,
  Close,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const ClientLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Get user data from localStorage
  const clientUser = localStorage.getItem('client_user');
  const user = clientUser ? JSON.parse(clientUser) : null;

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_user');
    navigate('/client/login');
    handleUserMenuClose();
  };

  const navigationItems = [
    { path: '/client', label: 'Accueil', icon: <Home />, value: 'home' },
    { path: '/client/booking', label: 'Réserver', icon: <CalendarToday />, value: 'booking' },
    { path: '/client/history', label: 'Historique', icon: <History />, value: 'history' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/client') {
      return location.pathname === '/client';
    }
    return location.pathname.startsWith(path);
  };

  const getCurrentBottomNavValue = () => {
    const currentPath = location.pathname;
    if (currentPath === '/client') return 'home';
    if (currentPath.startsWith('/client/booking')) return 'booking';
    if (currentPath.startsWith('/client/history')) return 'history';
    return 'home';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: 'background.default',
    }}>
      {/* Top App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ px: isMobile ? 2 : 3 }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo/Title */}
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              fontWeight: 700,
              fontSize: isMobile ? '1.1rem' : '1.25rem',
            }}
          >
            💇‍♀️ Salon
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: isActivePath(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* User Menu */}
          <IconButton
            size="large"
            edge="end"
            onClick={handleUserMenuOpen}
            color="inherit"
            sx={{ p: 1 }}
          >
            <Avatar 
              sx={{ 
                width: isMobile ? 32 : 36, 
                height: isMobile ? 32 : 36, 
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: isMobile ? '1rem' : '1.1rem',
              }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={userMenuAnchor}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.full_name || 'Client'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
              <Logout sx={{ mr: 2 }} />
              Se déconnecter
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              💇‍♀️ Salon
            </Typography>
            <IconButton onClick={() => setMobileDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.full_name || 'Client'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        <List sx={{ px: 2, py: 1 }}>
          {navigationItems.map((item) => (
            <ListItem
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileDrawerOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: isActivePath(item.path) ? 'primary.50' : 'transparent',
                '&:hover': {
                  bgcolor: 'grey.50',
                },
                cursor: 'pointer',
              }}
            >
              <ListItemIcon sx={{ color: isActivePath(item.path) ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActivePath(item.path) ? 600 : 400,
                  color: isActivePath(item.path) ? 'primary.main' : 'text.primary',
                }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ mx: 2 }} />

        <List sx={{ px: 2, py: 1 }}>
          <ListItem onClick={handleLogout} sx={{ borderRadius: 2, cursor: 'pointer' }}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Se déconnecter" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pb: isMobile ? 7 : 0, // Space for bottom navigation
        }}
      >
        <Outlet />
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderTop: 1,
            borderColor: 'divider',
          }} 
          elevation={3}
        >
          <BottomNavigation
            value={getCurrentBottomNavValue()}
            onChange={(event, newValue) => {
              const item = navigationItems.find(item => item.value === newValue);
              if (item) {
                navigate(item.path);
              }
            }}
            showLabels
            sx={{ 
              height: 64,
              '& .MuiBottomNavigationAction-root': {
                fontSize: '0.75rem',
                minWidth: 'auto',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              },
            }}
          >
            {navigationItems.map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      {/* Floating Action Button for Quick Booking */}
      {isMobile && location.pathname === '/client' && (
        <Fab
          color="primary"
          aria-label="quick booking"
          onClick={() => navigate('/client/booking')}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
};

export default ClientLayout; 