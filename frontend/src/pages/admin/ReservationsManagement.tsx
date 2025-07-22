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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Fab,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add,
  Search,
  Refresh,
  GridView,
  ViewList,
  Event,
  Person,
  Schedule,
  CheckCircle,
  Cancel,
  Pending,
  Done,
  Phone,
  AccessTime,
  Edit,
  Delete,
  ContentCopy,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReservationCard, ReservationDialog, ReservationDetailsDialog } from '../../components/reservations';
import type { Reservation, ReservationFormData, Service, Employee } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Reservation filters interface
interface ReservationFilters {
  search?: string;
  status?: 'all' | 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  type?: 'all' | 'online' | 'manual';
  sort_by?: 'start_at' | 'created_at' | 'status';
  sort_direction?: 'asc' | 'desc';
}

/**
 * ReservationsManagement Component
 * 
 * Complete reservation management system with CRUD operations
 * Features:
 * - Reservation listing with search and filters
 * - Create, edit, delete reservations
 * - Manual and online reservation support
 * - Service and employee assignment
 * - List view like in dashboard
 */
function ReservationsManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'manual'>('all');
  const [sortBy, setSortBy] = useState<'start_at' | 'created_at' | 'status'>('start_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Dialog states
  const [selectedReservation, setSelectedReservation] = useState<Reservation | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | undefined>();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reservationForDetails, setReservationForDetails] = useState<Reservation | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Query filters
  const filters: ReservationFilters = useMemo(() => ({
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    sort_by: sortBy,
    sort_direction: sortDirection,
  }), [searchQuery, statusFilter, typeFilter, sortBy, sortDirection]);

  // Data fetching - FIX: Use admin/reservations endpoint
  const {
    data: allReservations = [],
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch: refetchReservations,
  } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/reservations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reservation fetch error:', errorText);
        throw new Error(`Failed to fetch reservations: ${response.status}`);
      }
      const data = await response.json();
      console.log('Reservation API response:', data);
      // Handle Laravel pagination structure
      if (data?.success && data?.data?.data) {
        return data.data.data; // Laravel pagination: { success: true, data: { data: [...], meta: {...} } }
      } else if (data?.data) {
        return Array.isArray(data.data) ? data.data : []; // Direct data array
      } else if (Array.isArray(data)) {
        return data; // Direct array
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Get available services for assignment
  const {
    data: availableServices = [],
  } = useQuery({
    queryKey: ['services-for-assignment'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/services-list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
  });

  // Get available employees for assignment
  const {
    data: availableEmployees = [],
  } = useQuery({
    queryKey: ['employees-for-assignment'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      return data?.data?.data || data?.data || data || [];
    },
  });

  // Filter and sort reservations on the frontend
  const reservations = useMemo(() => {
    // Ensure allReservations is an array
    const reservationsArray = Array.isArray(allReservations) ? allReservations : [];
    let filtered = reservationsArray;

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((reservation: Reservation) =>
        (reservation.client?.full_name?.toLowerCase().includes(searchTerm)) ||
        (reservation.client_full_name?.toLowerCase().includes(searchTerm)) ||
        (reservation.client_phone?.toLowerCase().includes(searchTerm)) ||
        (reservation.service?.name?.toLowerCase().includes(searchTerm)) ||
        (reservation.employee?.full_name?.toLowerCase().includes(searchTerm))
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((reservation: Reservation) => reservation.status === filters.status);
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter((reservation: Reservation) => reservation.type === filters.type);
    }

    // Apply sorting
    filtered = [...filtered].sort((a: Reservation, b: Reservation) => {
      let aValue, bValue;
      
      switch (filters.sort_by) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'start_at':
        default:
          aValue = new Date(a.start_at).getTime();
          bValue = new Date(b.start_at).getTime();
          break;
      }

      if (aValue < bValue) return filters.sort_direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sort_direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allReservations, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const reservationsArray = Array.isArray(allReservations) ? allReservations : [];
    return {
      total: reservationsArray.length,
      confirmed: reservationsArray.filter((r: Reservation) => r.status === 'CONFIRMED').length,
      manual: reservationsArray.filter((r: Reservation) => r.type === 'manual').length,
      online: reservationsArray.filter((r: Reservation) => r.type === 'online').length,
    };
  }, [allReservations]);

  // Mutations
  const createReservationMutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/reservations`, {
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
        throw new Error(error.message || 'Erreur lors de la création de la réservation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setIsDialogOpen(false);
      setSelectedReservation(undefined);
      showSnackbar('Réservation créée avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la création de la réservation',
        'error'
      );
    },
  });

  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ReservationFormData> }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/reservations/${id}`, {
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
        throw new Error(error.message || 'Erreur lors de la modification de la réservation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setIsDialogOpen(false);
      setSelectedReservation(undefined);
      showSnackbar('Réservation modifiée avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la modification de la réservation',
        'error'
      );
    },
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression de la réservation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setDeleteDialogOpen(false);
      setReservationToDelete(undefined);
      showSnackbar('Réservation supprimée avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la suppression de la réservation',
        'error'
      );
    },
  });

  // Event handlers
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleCreateReservation = () => {
    setSelectedReservation(undefined);
    setIsDialogOpen(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    console.log('Editing reservation:', reservation);
    setSelectedReservation(reservation);
    setIsDialogOpen(true);
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    console.log('Deleting reservation:', reservation);
    setReservationToDelete(reservation);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteReservation = () => {
    if (reservationToDelete) {
      deleteReservationMutation.mutate(reservationToDelete.id);
    }
  };

  const handleDuplicateReservation = (reservation: Reservation) => {
    console.log('Duplicating reservation:', reservation);
    // Create a duplicate with current date/time
    const duplicateData: Partial<Reservation> = {
      ...reservation,
      id: undefined,
      start_at: new Date().toISOString(),
      status: 'CONFIRMED',
    };
    
    setSelectedReservation(duplicateData as Reservation);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (reservation: Reservation) => {
    setReservationForDetails(reservation);
    setDetailsDialogOpen(true);
  };

  const handleSubmitReservation = (data: ReservationFormData) => {
    if (selectedReservation && selectedReservation.id) {
      updateReservationMutation.mutate({ id: selectedReservation.id, data });
    } else {
      createReservationMutation.mutate(data);
    }
  };

  const handleRefresh = () => {
    refetchReservations();
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle color="success" />;
      case 'REQUESTED': return <Pending color="warning" />;
      case 'CANCELLED': return <Cancel color="error" />;
      case 'COMPLETED': return <Done color="primary" />;
      default: return <Event />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'REQUESTED': return 'warning';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'primary';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'manual' ? 'secondary' : 'info';
  };

  // Loading state
  const isLoading = createReservationMutation.isPending || updateReservationMutation.isPending || deleteReservationMutation.isPending;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Gestion des Réservations
        </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualiser">
              <span>
                <IconButton onClick={handleRefresh} disabled={reservationsLoading}>
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
            
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateReservation}
                size="large"
              >
                Nouvelle Réservation
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Gérez toutes vos réservations en ligne et manuelles
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
        gap: 3,
        mb: 4 
      }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Event color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{stats.total}</Typography>
          <Typography variant="body2" color="text.secondary">
            Total Réservations
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{stats.confirmed}</Typography>
          <Typography variant="body2" color="text.secondary">
            Confirmées
      </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Person color="secondary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{stats.manual}</Typography>
          <Typography variant="body2" color="text.secondary">
            Manuelles
                  </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Schedule color="info" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{stats.online}</Typography>
          <Typography variant="body2" color="text.secondary">
            En Ligne
                  </Typography>
        </Paper>
              </Box>

      {/* Filters and Search */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2, 
        mb: 4,
        p: 3, 
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}>
        {/* Search */}
        <TextField
          placeholder="Rechercher une réservation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />

        {/* Filter Options */}
        <Box sx={{ display: 'flex', gap: 2, minWidth: { md: 500 } }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="REQUESTED">Demandé</MenuItem>
              <MenuItem value="CONFIRMED">Confirmé</MenuItem>
              <MenuItem value="CANCELLED">Annulé</MenuItem>
              <MenuItem value="COMPLETED">Terminé</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="online">En ligne</MenuItem>
              <MenuItem value="manual">Manuelle</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Trier par</InputLabel>
            <Select
              value={sortBy}
              label="Trier par"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="start_at">Date/Heure</MenuItem>
              <MenuItem value="created_at">Date de création</MenuItem>
              <MenuItem value="status">Statut</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Ordre</InputLabel>
            <Select
              value={sortDirection}
              label="Ordre"
              onChange={(e) => setSortDirection(e.target.value as any)}
            >
              <MenuItem value="asc">Croissant</MenuItem>
              <MenuItem value="desc">Décroissant</MenuItem>
            </Select>
          </FormControl>

          {/* View Toggle */}
          <Box sx={{ display: 'flex' }}>
            <IconButton
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridView />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ViewList />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Reservations List */}
      {reservationsLoading ? (
        <Typography>Chargement des réservations...</Typography>
      ) : reservationsError ? (
        <Alert severity="error">Erreur lors du chargement des réservations: {reservationsError.message}</Alert>
      ) : reservations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune réservation trouvée
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'Essayez de modifier vos critères de recherche.' 
              : 'Commencez par ajouter votre première réservation.'}
          </Typography>
          {!(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
            <Button variant="contained" startIcon={<Add />} onClick={handleCreateReservation}>
              Ajouter une réservation
            </Button>
          )}
        </Box>
      ) : viewMode === 'list' ? (
        <Paper sx={{ mb: 4 }}>
          <List>
            {reservations.map((reservation: Reservation, index: number) => (
              <Box key={reservation.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getStatusColor(reservation.status) + '.main' }}>
                      {getStatusIcon(reservation.status)}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" component="span">
                          {reservation.client?.full_name || reservation.client_full_name || 'Client inconnu'}
                        </Typography>
                        <Chip
                          label={reservation.status}
                          size="small"
                          color={getStatusColor(reservation.status) as any}
                          variant="outlined"
                        />
                        <Chip
                          label={reservation.type === 'manual' ? 'Manuelle' : 'En ligne'}
                          size="small"
                          color={getTypeColor(reservation.type) as any}
                          variant="filled"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime fontSize="small" color="action" />
                            <Typography variant="body2">
                              {format(new Date(reservation.start_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </Typography>
                          </Box>
                          {(reservation.client_phone || reservation.client?.phone) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2">
                                {reservation.client_phone || reservation.client?.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Service:</strong> {reservation.service?.name || 'Service inconnu'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Employé:</strong> {reservation.employee?.full_name || 'Employé inconnu'}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Voir détails">
                      <IconButton size="small" onClick={() => handleViewDetails(reservation)}>
                        <Search />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton size="small" onClick={() => handleEditReservation(reservation)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Dupliquer">
                      <IconButton size="small" onClick={() => handleDuplicateReservation(reservation)}>
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton size="small" onClick={() => handleDeleteReservation(reservation)} color="error">
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
                {index < reservations.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 3
        }}>
          {reservations.map((reservation: Reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onEdit={handleEditReservation}
              onDelete={handleDeleteReservation}
              onDuplicate={handleDuplicateReservation}
              onViewDetails={handleViewDetails}
              showDetails={true}
              showActions={true}
            />
          ))}
        </Box>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateReservation}
        >
          <Add />
        </Fab>
      )}

      {/* Reservation Dialog */}
      <ReservationDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedReservation(undefined);
        }}
        reservation={selectedReservation}
        onSubmit={handleSubmitReservation}
        loading={isLoading}
        error={createReservationMutation.error?.message || updateReservationMutation.error?.message}
        availableServices={availableServices}
        availableEmployees={availableEmployees}
      />

      {/* Reservation Details Dialog */}
      <ReservationDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setReservationForDetails(null);
        }}
        reservation={reservationForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer la réservation de "{reservationToDelete?.client?.full_name || reservationToDelete?.client_full_name}" ? 
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button 
            onClick={confirmDeleteReservation} 
            color="error" 
            variant="contained"
            disabled={deleteReservationMutation.isPending}
          >
            {deleteReservationMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ReservationsManagement; 
