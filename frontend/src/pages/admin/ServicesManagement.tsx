import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  useMediaQuery,
  useTheme,
  Paper,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,

  GridView,
  ViewList,

  Refresh,

} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceCard, ServiceDialog, ServiceDetailsDialog, ServiceEmployeeDialog } from '../../components/services';
// import { serviceApi } from '../../services/serviceApi'; // Using direct fetch instead
import type { Service, ServiceFormData, ServiceFilters } from '../../types';

/**
 * ServicesManagement Component
 * 
 * Comprehensive services management interface featuring:
 * - CRUD operations for services
 * - Search and filtering capabilities
 * - Grid and list view options
 * - Service statistics dashboard
 * - Employee assignment management
 * - Responsive design
 * - Real-time data synchronization
 */
function ServicesManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ServiceFilters['sort_by']>('name');
  const [sortDirection, setSortDirection] = useState<ServiceFilters['sort_direction']>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | undefined>();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [serviceForDetails, setServiceForDetails] = useState<Service | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [serviceForEmployees, setServiceForEmployees] = useState<Service | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Query filters
  const filters: ServiceFilters = useMemo(() => ({
    search: searchQuery || undefined,
    sort_by: sortBy,
    sort_direction: sortDirection,
  }), [searchQuery, sortBy, sortDirection]);

  // Data fetching with search and filtering
  const {
    data: allServices = [],
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/services`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter and sort services on the frontend
  const services = useMemo(() => {
    let filtered = allServices;

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((service: Service) =>
        service.name.toLowerCase().includes(searchTerm) ||
        (service.description && service.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a: Service, b: Service) => {
      let aValue, bValue;
      
      switch (filters.sort_by) {
        case 'price_dhs':
          aValue = parseFloat(String(a.price_dhs));
          bValue = parseFloat(String(b.price_dhs));
          break;
        case 'duration_min':
          aValue = a.duration_min;
          bValue = b.duration_min;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'name':
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
      }

      if (aValue < bValue) return filters.sort_direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sort_direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allServices, filters]);

  // Remove statistics for now since the endpoint might not be implemented
  // const {
  //   data: statistics,
  //   isLoading: statsLoading,
  // } = useQuery({
  //   queryKey: ['service-statistics'],
  //   queryFn: () => serviceApi.getServiceStatistics(),
  //   staleTime: 10 * 60 * 1000, // 10 minutes
  // });

  // Create Service Mutation - Now functional
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/services`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsDialogOpen(false);
      setSelectedService(undefined);
      showSnackbar('Service créé avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la création du service',
        'error'
      );
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServiceFormData> }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/services/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la modification du service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsDialogOpen(false);
      setSelectedService(undefined);
      showSnackbar('Service modifié avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la modification du service',
        'error'
      );
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression du service');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleteDialogOpen(false);
      setServiceToDelete(undefined);
      showSnackbar('Service supprimé avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la suppression du service',
        'error'
      );
    },
  });

  // Remove duplicate functionality for now
  // const duplicateServiceMutation = useMutation({
  //   mutationFn: ({ id, newName }: { id: number; newName: string }) =>
  //     serviceApi.duplicateService(id, newName),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['admin-services'] });
  //     showSnackbar('Service dupliqué avec succès', 'success');
  //   },
  //   onError: (error: any) => {
  //     showSnackbar(
  //       error.message || 'Erreur lors de la duplication du service',
  //       'error'
  //     );
  //   },
  // });

  // Event handlers
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleCreateService = () => {
    setSelectedService(undefined);
    setIsDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteService = () => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete.id);
    }
  };

  const handleDuplicateService = (service: Service) => {
    // Create a duplicate with modified name
    const duplicateData: ServiceFormData = {
      name: `${service.name} (Copie)`,
      description: service.description || '',
      duration_min: service.duration_min,
      price_dhs: service.price_dhs,
    };
    
    createServiceMutation.mutate(duplicateData);
  };

  const handleSubmitService = (data: ServiceFormData) => {
    if (selectedService) {
      updateServiceMutation.mutate({ id: selectedService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleViewDetails = (service: Service) => {
    setServiceForDetails(service);
    setDetailsDialogOpen(true);
  };

  const handleManageEmployees = (service: Service) => {
    setServiceForEmployees(service);
    setEmployeeDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchServices();
    // queryClient.invalidateQueries({ queryKey: ['service-statistics'] });
  };

  // Loading state
  const isLoading = createServiceMutation.isPending || updateServiceMutation.isPending || deleteServiceMutation.isPending;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Gestion des Services
        </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualiser">
              <span>
                <IconButton onClick={handleRefresh} disabled={servicesLoading}>
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
            
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateService}
                size="large"
              >
                Nouveau Service
              </Button>
            )}
                </Box>
              </Box>

        <Typography variant="body1" color="text.secondary">
          Gérez votre catalogue de prestations et tarifs
        </Typography>
      </Box>

      {/* Statistics Cards - Commented out until backend endpoint is ready */}
      {false && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4 
        }}>
          {/* Statistics cards will be added when backend endpoint is available */}
        </Box>
      )}

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems="center">
          {/* Search */}
          <TextField
            placeholder="Rechercher un service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 250 }}
          />

          {/* Sort */}
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Trier par</InputLabel>
            <Select
              value={sortBy}
              label="Trier par"
              onChange={(e) => setSortBy(e.target.value as ServiceFilters['sort_by'])}
            >
              <MenuItem value="name">Nom</MenuItem>
              <MenuItem value="price_dhs">Prix</MenuItem>
              <MenuItem value="duration_min">Durée</MenuItem>
              <MenuItem value="created_at">Date création</MenuItem>
            </Select>
          </FormControl>

          {/* Sort Direction */}
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Ordre</InputLabel>
            <Select
              value={sortDirection}
              label="Ordre"
              onChange={(e) => setSortDirection(e.target.value as ServiceFilters['sort_direction'])}
            >
              <MenuItem value="asc">Croissant</MenuItem>
              <MenuItem value="desc">Décroissant</MenuItem>
            </Select>
          </FormControl>

          {/* View Mode */}
          <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{
                bgcolor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: viewMode === 'grid' ? 'primary.dark' : 'grey.100',
                },
              }}
            >
              <GridView />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              sx={{
                bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: viewMode === 'list' ? 'primary.dark' : 'grey.100',
                },
              }}
            >
              <ViewList />
            </IconButton>
          </Box>
        </Stack>
      </Paper>

      {/* Services Grid/List */}
      {servicesError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors du chargement des services. Veuillez réessayer.
        </Alert>
      )}

      {servicesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={48} />
        </Box>
      ) : services.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery ? 'Aucun service trouvé' : 'Aucun service disponible'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? 'Essayez de modifier votre recherche'
              : 'Commencez par créer votre premier service'}
          </Typography>
          {!searchQuery && (
            <Button variant="contained" startIcon={<Add />} onClick={handleCreateService}>
              Créer un service
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' 
            ? { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }
            : '1fr',
          gap: 3
        }}>
          {services.map((service: Service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
              onDuplicate={handleDuplicateService}
              onViewDetails={handleViewDetails}
              onManageEmployees={handleManageEmployees}
              showEmployees={true}
              showStatistics={true}
            />
          ))}
        </Box>
      )}

      {/* Floating Action Button (Mobile) */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={handleCreateService}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Service Dialog */}
      <ServiceDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedService(undefined);
        }}
        service={selectedService}
        onSubmit={handleSubmitService}
        loading={isLoading}
        error={createServiceMutation.error?.message || updateServiceMutation.error?.message}
      />

      {/* Service Details Dialog */}
      <ServiceDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setServiceForDetails(null);
        }}
        service={serviceForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le service "{serviceToDelete?.name}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={confirmDeleteService}
            color="error"
            variant="contained"
            disabled={deleteServiceMutation.isPending}
          >
            {deleteServiceMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Employee Management Dialog */}
      <ServiceEmployeeDialog
        open={employeeDialogOpen}
        onClose={() => {
          setEmployeeDialogOpen(false);
          setServiceForEmployees(null);
        }}
        service={serviceForEmployees}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ServicesManagement; 