import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close,
  Business,
  AttachMoney,
  AccessTime,
  EventNote,
  TrendingUp,
  People,
  CalendarToday,
  Analytics,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import type { Service } from '../../../types';

interface ServiceDetailsDialogProps {
  open: boolean;
  service: Service | null;
  onClose: () => void;
}

// Mock analytics data structure (replace with real API when available)
interface ServiceAnalytics {
  totalReservations: number;
  pastReservations: number;
  futureReservations: number;
  totalRevenue: number;
  averageRating: number;
  popularTimes: string[];
  monthlyBookings: number;
  growthRate: number;
}

// API function to fetch service analytics
const fetchServiceAnalytics = async (_serviceId: number): Promise<ServiceAnalytics> => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    // This is a mock implementation - replace with real API call
    // const response = await axios.get(`/api/services/${_serviceId}/analytics`, {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //   },
    // });
    
    // Mock data for demonstration
    const mockData: ServiceAnalytics = {
      totalReservations: Math.floor(Math.random() * 100) + 20,
      pastReservations: Math.floor(Math.random() * 60) + 10,
      futureReservations: Math.floor(Math.random() * 40) + 5,
      totalRevenue: Math.floor(Math.random() * 50000) + 5000,
      averageRating: 4.2 + Math.random() * 0.7,
      popularTimes: ['10:00', '14:00', '16:00'],
      monthlyBookings: Math.floor(Math.random() * 30) + 5,
      growthRate: Math.random() * 20 - 5, // -5% to +15%
    };
    
    return mockData;
  } catch (error: any) {
    console.error('❌ Service analytics API error:', error);
    throw error;
  }
};

/**
 * ServiceDetailsDialog Component
 * 
 * Displays detailed service information in a dialog popup:
 * - Service details (name, description, price, duration)
 * - Analytics (reservations, revenue, popularity)
 * - Action buttons for editing/managing
 */
export const ServiceDetailsDialog: React.FC<ServiceDetailsDialogProps> = ({ open, service, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Query for service analytics
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ['service-analytics', service?.id],
    queryFn: () => fetchServiceAnalytics(service!.id),
    enabled: !!service?.id && open,
    refetchOnWindowFocus: false,
  });

  if (!service) {
    return null;
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit service:', service.id);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      // TODO: Implement delete functionality
      console.log('Delete service:', service.id);
      setConfirmDelete(false);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  // Generate colors for the service
  const getServiceColor = (name: string): string => {
    const colors = [
      'primary.main',
      'secondary.main',
      'success.main',
      'info.main',
      'warning.main',
      'error.main',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getServiceBgColor = (name: string): string => {
    const colors = [
      'primary.light',
      'secondary.light',
      'success.light',
      'info.light',
      'warning.light',
      'error.light',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const serviceColor = getServiceColor(service.name);
  const serviceBgColor = getServiceBgColor(service.name);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: serviceBgColor,
                color: serviceColor,
                width: 48,
                height: 48,
              }}
            >
              <Business />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {service.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Détails du service
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} color="inherit">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Service Information Card */}
        <Card elevation={1} sx={{ mb: 2, border: '1px solid #f0f0f0' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Informations du Service
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {service.description || 'Aucune description disponible'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ color: 'secondary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Prix
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {service.price_dhs} DHS
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime sx={{ color: 'secondary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Durée
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {service.duration_min} min
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                <Analytics />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Analyses et Statistiques
              </Typography>
            </Box>

            {analyticsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : analyticsError ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Impossible de charger les statistiques
              </Alert>
            ) : analytics ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Key Metrics */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: '200px' }}>
                    <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <EventNote sx={{ fontSize: '2rem', color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {analytics.totalReservations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Réservations
                      </Typography>
                    </Card>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: '200px' }}>
                    <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: '2rem', color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {analytics.totalRevenue.toLocaleString()} DHS
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Revenus Générés
                      </Typography>
                    </Card>
                  </Box>
                </Box>

                {/* Past vs Future Reservations */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Réservations Passées
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ color: 'secondary.main' }} />
                                                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {analytics.pastReservations}
                        </Typography>
                      </Box>
                    </Card>
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Réservations Futures
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People sx={{ color: 'secondary.main' }} />
                                                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {analytics.futureReservations}
                        </Typography>
                      </Box>
                    </Card>
                  </Box>
                </Box>

                {/* Additional Stats */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Statistiques Supplémentaires
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={`${analytics.monthlyBookings} réservations ce mois`}
                      variant="outlined"
                      color="primary"
                    />
                    <Chip
                      label={`${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}% croissance`}
                      variant="outlined"
                      color={analytics.growthRate > 0 ? 'success' : 'error'}
                    />
                    <Chip
                      label={`${analytics.averageRating.toFixed(1)}/5.0 satisfaction`}
                      variant="outlined"
                      color="info"
                    />
                  </Box>
                </Box>
              </Box>
            ) : null}
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              État du Service
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label="Actif"
                color="success"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Service disponible pour les réservations
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Fermer
        </Button>
        <Button
          onClick={handleEdit}
          startIcon={<Edit />}
          variant="outlined"
          color="primary"
        >
          Modifier
        </Button>
        <Button
          onClick={handleDelete}
          startIcon={<Delete />}
          variant="outlined"
          color="error"
          sx={{
            bgcolor: confirmDelete ? 'error.main' : 'transparent',
            color: confirmDelete ? 'white' : 'error.main',
            '&:hover': {
              bgcolor: confirmDelete ? 'error.dark' : 'error.light',
            },
          }}
        >
          {confirmDelete ? 'Confirmer' : 'Supprimer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 