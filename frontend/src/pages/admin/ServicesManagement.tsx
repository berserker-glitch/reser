import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Fab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Close,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { LoadingScreen } from '../../components/ui';
import { ServicesAnalytics } from '../../components/admin/services/ServicesAnalytics';
import { ServiceCard } from '../../components/admin/services/ServiceCard';
import { ServiceDetailsDialog } from '../../components/admin/services/ServiceDetailsDialog';
import type { Service } from '../../types';
import axios from 'axios';

// Configure axios baseURL
axios.defaults.baseURL = 'http://localhost:8000';

// API functions
const fetchServices = async (): Promise<Service[]> => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await axios.get('/api/services', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data || [];
  } catch (error: any) {
    console.error('❌ Services API error:', error.response?.status, error.response?.data);
    throw error;
  }
};

const fetchServiceStatistics = async () => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await axios.get('/api/services/statistics', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Service statistics API error:', error.response?.status, error.response?.data);
    throw error;
  }
};

const createService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await axios.post('/api/services', serviceData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Create service API error:', error.response?.status, error.response?.data);
    throw error;
  }
};

// Form interface
interface ServiceFormData {
  name: string;
  description: string;
  duration_min: number;
  price_dhs: number;
}

/**
 * ServicesManagement Component
 * 
 * Complete services management page with:
 * - Analytics at the top showing service statistics
 * - Grid layout of service cards
 * - Create service form in a dialog
 * - Service details popup with analytics
 * - Responsive design
 */
const ServicesManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  
  // State management
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>();

  // Queries
  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    refetchOnWindowFocus: false,
  });

  const {
    data: statistics,
    isLoading: statisticsLoading,
    error: statisticsError,
  } = useQuery({
    queryKey: ['service-statistics'],
    queryFn: fetchServiceStatistics,
    refetchOnWindowFocus: false,
  });

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: createService,
    onSuccess: (newService) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-statistics'] });
      setCreateDialogOpen(false);
      reset();
      setSuccessMessage(`Service "${newService.name}" créé avec succès !`);
    },
    onError: (error: any) => {
      console.error('Create service error:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la création du service';
      setErrorMessage(errorMsg);
    },
  });

  // Handlers
  const handleCreateService = (data: ServiceFormData) => {
    createServiceMutation.mutate(data);
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setDetailsDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    reset();
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedService(null);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Loading state
  if (servicesLoading || statisticsLoading) {
    return <LoadingScreen message="Chargement des services..." />;
  }

  // Error state
  if (servicesError || statisticsError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erreur lors du chargement des services. Veuillez réessayer.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Gestion des Services
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Gérez votre catalogue de prestations
        </Typography>
      </Box>

      {/* Analytics Section */}
      <Box sx={{ mb: 4 }}>
        <ServicesAnalytics statistics={statistics} />
      </Box>

      {/* Services Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Services Disponibles
        </Typography>

        {services && services.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 3,
              justifyContent: 'flex-start',
              alignItems: 'stretch',
            }}
          >
            {services.map((service) => (
              <Box
                key={service.id}
                sx={{
                  flex: '1 1 300px',
                  maxWidth: isMobile ? '100%' : '400px',
                  minWidth: isMobile ? '100%' : '300px',
                }}
              >
                <ServiceCard
                  service={service}
                  onClick={() => handleServiceClick(service)}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun service disponible
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cliquez sur le bouton "+" pour créer votre premier service
            </Typography>
          </Box>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add service"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Create Service Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Créer un Nouveau Service</Typography>
            <Button
              onClick={handleCloseCreateDialog}
              color="inherit"
              sx={{ minWidth: 'auto', p: 1 }}
            >
              <Close />
            </Button>
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleSubmit(handleCreateService)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Controller
                name="name"
                control={control}
                defaultValue=""
                rules={{ required: 'Le nom est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nom du Service"
                    variant="outlined"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />

              <Controller
                name="duration_min"
                control={control}
                defaultValue={30}
                rules={{ 
                  required: 'La durée est requise',
                  min: { value: 15, message: 'La durée minimale est de 15 minutes' },
                  max: { value: 480, message: 'La durée maximale est de 8 heures' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Durée (minutes)"
                    variant="outlined"
                    fullWidth
                    type="number"
                    error={!!errors.duration_min}
                    helperText={errors.duration_min?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />

              <Controller
                name="price_dhs"
                control={control}
                defaultValue={0}
                rules={{ 
                  required: 'Le prix est requis',
                  min: { value: 0, message: 'Le prix doit être positif' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Prix (DHS)"
                    variant="outlined"
                    fullWidth
                    type="number"
                    error={!!errors.price_dhs}
                    helperText={errors.price_dhs?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                )}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseCreateDialog} color="inherit">
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || createServiceMutation.isPending}
            >
              {isSubmitting || createServiceMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Service Details Dialog */}
      <ServiceDetailsDialog
        open={detailsDialogOpen}
        service={selectedService}
        onClose={handleCloseDetailsDialog}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!successMessage || !!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={successMessage ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {successMessage || errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ServicesManagement; 