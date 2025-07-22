import React, { useState } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,

  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data - will be replaced with real API calls
const mockReservations = [
  {
    id: 1,
    service: { name: 'Coupe Homme', duration_min: 30 },
    employee: { full_name: 'Leila Benjelloun' },
    salon: { name: 'Salon Elite Rabat', address: '45 Avenue Mohammed V, Rabat' },
    start_at: '2025-07-31T14:30:00Z',
    end_at: '2025-07-31T15:00:00Z',
    status: 'CONFIRMED',
  },
  {
    id: 2,
    service: { name: 'Coloration', duration_min: 90 },
    employee: { full_name: 'Amina Tazi' },
    salon: { name: 'Salon Elite Rabat', address: '45 Avenue Mohammed V, Rabat' },
    start_at: '2025-07-25T10:00:00Z',
    end_at: '2025-07-25T11:30:00Z',
    status: 'COMPLETED',
  },
];

const mockUser = {
  full_name: 'Test Client',
  email: 'test@client.com',
  phone: '+212600000001',
};

const ClientDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
    handleMenuClose();
  };

  const handleNewReservation = () => {
    // Navigate to salon selection or specific salon
    navigate('/salon/salon-elite-rabat'); // For now, navigate to the test salon
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'REQUESTED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmé';
      case 'COMPLETED':
        return 'Terminé';
      case 'CANCELLED':
        return 'Annulé';
      case 'REQUESTED':
        return 'En attente';
      default:
        return status;
  }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Mon Tableau de Bord
          </Typography>
          
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleNewReservation}
            sx={{ mr: 2 }}
          >
            Nouvelle Réservation
          </Button>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
      >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              <PersonIcon />
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">{mockUser.full_name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {mockUser.email}
            </Typography>
          </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Bonjour, {mockUser.full_name}! 👋
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Gérez vos réservations et découvrez nos services.
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="client dashboard tabs">
            <Tab icon={<HistoryIcon />} label="Mes Réservations" />
            <Tab icon={<PersonIcon />} label="Mon Profil" />
          </Tabs>
        </Box>

        {/* Reservations Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Mes Réservations
            </Typography>
            {mockReservations.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6 }}>
                <CardContent>
                  <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Aucune réservation
                </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Vous n'avez pas encore de réservation.
                </Typography>
                <Button
                  variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewReservation}
                >
                    Faire une réservation
                </Button>
              </CardContent>
            </Card>
          ) : (
                             <Box 
                  sx={{
                   display: 'grid', 
                   gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
                   gap: 3 
                  }}
                >
                 {mockReservations.map((reservation) => (
                   <Box key={reservation.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">
                            {reservation.service.name}
                          </Typography>
                          <Chip
                            label={getStatusText(reservation.status)}
                            color={getStatusColor(reservation.status) as any}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          👨‍💼 {reservation.employee.full_name}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          🏪 {reservation.salon.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="textSecondary">
                            {format(new Date(reservation.start_at), 'dd/MM/yyyy')}
                            </Typography>
                          </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <TimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="textSecondary">
                              {format(new Date(reservation.start_at), 'HH:mm')} - {format(new Date(reservation.end_at), 'HH:mm')}
                            </Typography>
                          </Box>
                        
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                          Durée: {reservation.service.duration_min} minutes
                              </Typography>
                  </CardContent>
                </Card>
                   </Box>
              ))}
               </Box>
          )}
          </Box>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Mon Profil
            </Typography>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{mockUser.full_name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Client
                </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body1">{mockUser.email}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  <Typography variant="body1">{mockUser.phone}</Typography>
                    </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
    </Container>
    </Box>
  );
};

export default ClientDashboard; 