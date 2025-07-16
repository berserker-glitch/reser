import React, { useState } from 'react';
import {
  Box,
  Paper,
  Drawer,
  List,
  Avatar,
  Typography,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
  InputAdornment,
  Tooltip,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search,
  SquareOutlined,
  NotificationsOutlined,
  ExpandMore,
  RestartAlt,
  Refresh,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useNavigationStore } from '../../store/navigationStore';
import { useGlobalLoading } from '../../hooks/useGlobalLoading';
import { LoadingScreen } from '../ui';
import { useQueryClient } from '@tanstack/react-query';
import DraggableNavItem from './DraggableNavItem';

const drawerWidth = 64;

/**
 * AdminLayout Component
 * 
 * Enhanced layout with drag-and-drop navigation:
 * - Customizable navigation order with grid system
 * - Persistent navigation state using localStorage
 * - Visual feedback during drag operations
 * - Reset functionality to restore default order
 * - Accessibility support with keyboard navigation
 */
function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [showResetSnackbar, setShowResetSnackbar] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Navigation store
  const { navigationItems, reorderNavigation, resetNavigation } = useNavigationStore();
  
  // Global loading state
  const { isLoading, loadingMessage, withLoading } = useGlobalLoading();
  
  // Query client for refresh functionality
  const queryClient = useQueryClient();
  
  // Mobile responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    navigate('/login');
    handleUserMenuClose();
  };

  /**
   * Handle drag end event for navigation reordering
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = navigationItems.findIndex((item) => item.id === active.id);
      const newIndex = navigationItems.findIndex((item) => item.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderNavigation(oldIndex, newIndex);
      }
    }
  };

  /**
   * Reset navigation to default order
   */
  const handleResetNavigation = () => {
    resetNavigation();
    setShowResetSnackbar(true);
  };

  /**
   * Refresh all data with global loading screen
   */
  const handleRefreshData = async () => {
    await withLoading(
      async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['services'] }),
          queryClient.invalidateQueries({ queryKey: ['reservations'] }),
          queryClient.invalidateQueries({ queryKey: ['employees'] }),
          queryClient.invalidateQueries({ queryKey: ['working-hours'] }),
        ]);
        // Wait a bit for queries to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      'Actualisation des données...'
    );
  };

  return (
    <Box sx={{ bgcolor: '#e5e5e5', width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Main container */}
      <Paper 
        elevation={0} 
        square 
        sx={{ 
          display: 'flex', 
          width: '100%',
          height: '100vh',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        {/* Left Navigation Drawer - Collapsed with Drag & Drop */}
        {/* Shared Drawer Content */}
        {(() => {
          const drawerContent = (
            <>
              {/* Logo Avatar */}
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: 'primary.main',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                  }}
                >
                  S
                </Avatar>
              </Box>

              {/* Drag & Drop Navigation List */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={navigationItems.map(item => item.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <List dense sx={{ mt: 2, px: 1 }}>
                    {navigationItems.map((item, index) => (
                      <DraggableNavItem
                        key={item.id}
                        item={item}
                        index={index}
                        isSelected={location.pathname === item.path}
                        onClick={() => handleNavigation(item.path)}
                      />
                    ))}
                  </List>
                </SortableContext>
              </DndContext>

              {/* Reset Button */}
              <Box sx={{ mt: 'auto', p: 1 }}>
                <Tooltip title="Réinitialiser l'ordre" placement="right" arrow>
                  <IconButton
                    size="small"
                    onClick={handleResetNavigation}
                    sx={{
                      width: '100%',
                      height: 36,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                    }}
                  >
                    <RestartAlt fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          );

          return (
            <>
              {/* Mobile Drawer */}
              {isMobile && (
                <Drawer
                  variant="temporary"
                  open={mobileOpen}
                  onClose={handleDrawerToggle}
                  ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                  }}
                  sx={{
                    '& .MuiDrawer-paper': {
                      width: drawerWidth,
                      boxSizing: 'border-box',
                      border: 'none',
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  {drawerContent}
                </Drawer>
              )}
              
              {/* Desktop Drawer */}
              {!isMobile && (
                <Drawer
                  variant="permanent"
                  sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                      width: drawerWidth,
                      boxSizing: 'border-box',
                      position: 'fixed',
                      height: '100vh',
                      border: 'none',
                      bgcolor: 'background.paper',
                      zIndex: 1200,
                    },
                  }}
                >
                  {drawerContent}
                </Drawer>
              )}
            </>
          );
        })()}

        {/* Main Content Area */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          marginLeft: isMobile ? 0 : `${drawerWidth}px`,
          width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
        }}>
          {/* Top Horizontal Bar - Sticky Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: isMobile ? 2 : 3,
              py: 2,
              position: 'sticky',
              top: 0,
              zIndex: 1100,
            }}
          >
            {/* Left side - Mobile Menu Button, Breadcrumb and Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 3 }}>
              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 1 }}
                >
                  <SquareOutlined />
                </IconButton>
              )}
              
              {!isMobile && (
                <Typography variant="body2" color="text.secondary">
                  Accueil / profil clic
                </Typography>
              )}
              
              <TextField
                size="small"
                placeholder="Search…"
                variant="outlined"
                sx={{ width: isMobile ? 150 : 200 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Center - Page Links (Hidden on mobile) */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button color="inherit" size="small">
                  Mes calendriers
                </Button>
                <Button color="inherit" size="small">
                  Ma page web
                </Button>
                <Button color="inherit" size="small">
                  Intégration
                </Button>
              </Box>
            )}

            {/* Right side - Icons and User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
              {!isMobile && (
                <IconButton size="small">
                  <SquareOutlined />
                </IconButton>
              )}
              
              <Tooltip title="Actualiser les données">
                <IconButton size="small" onClick={handleRefreshData}>
                  <Refresh />
                </IconButton>
              </Tooltip>

              <IconButton size="small">
                <Badge
                  variant="dot"
                  color="error"
                  sx={{
                    '& .MuiBadge-dot': {
                      width: 6,
                      height: 6,
                    },
                  }}
                >
                  <NotificationsOutlined />
                </Badge>
              </IconButton>

              {/* User Menu */}
              <Button
                color="inherit"
                onClick={handleUserMenuOpen}
                startIcon={
                  <Avatar sx={{ width: 32, height: 32 }}>
                    AM
                  </Avatar>
                }
                endIcon={!isMobile ? <ExpandMore /> : null}
                sx={{
                  textTransform: 'none',
                  ml: isMobile ? 0.5 : 1,
                  minWidth: isMobile ? 'auto' : 'unset',
                }}
              >
                {!isMobile && (
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Alex Morales
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Directeur
                    </Typography>
                  </Box>
                )}
              </Button>

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleUserMenuClose}>Mon profil</MenuItem>
                <MenuItem onClick={handleUserMenuClose}>Valeur 2</MenuItem>
                <MenuItem onClick={handleUserMenuClose}>Valeur 3</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Se déconnecter</MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, p: 3 }}>
            <Outlet />
          </Box>
        </Box>
      </Paper>

      {/* Reset Navigation Snackbar */}
      <Snackbar
        open={showResetSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowResetSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setShowResetSnackbar(false)} 
          severity="success" 
          variant="filled"
        >
          Navigation réinitialisée avec succès
        </Alert>
      </Snackbar>
      
      {/* Global Loading Screen */}
      {isLoading && (
        <LoadingScreen 
          message={loadingMessage} 
          fullScreen={true}
        />
      )}
    </Box>
  );
}

export default AdminLayout; 