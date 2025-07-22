import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Phone,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnhancedCalendar } from '../../components/admin';
import axios from 'axios';
import { format, startOfMonth} from 'date-fns';
import { fr } from 'date-fns/locale';

// Configure axios baseURL
axios.defaults.baseURL = 'http://localhost:8000';

// API functions with improved error handling
const fetchServices = async () => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await axios.get('/api/admin/services-list', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    // Handle token-related errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_salon');
      window.location.href = '/login';
      throw new Error('Authentication failed. Please log in again.');
    }
    throw error;
  }
};

const fetchReservations = async () => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await axios.get('/api/admin/reservations', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    // Let serviceApi interceptor handle auth errors to avoid double redirects
    throw error;
  }
};

const fetchEmployees = async () => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await axios.get('/api/admin/employees', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    // Ensure we return the data in a consistent format
    const data = response.data;
    if (data?.success && data?.data) {
      return data; // API returns { success: true, data: [...] }
    } else if (Array.isArray(data)) {
      return { success: true, data: data }; // API returns [...] directly
    } else {
      return { success: true, data: data?.data || [] }; // Other formats
    }
  } catch (error: any) {
    // Let serviceApi interceptor handle auth errors to avoid double redirects
    throw error;
  }
};

// Update reservation status
const updateReservationStatus = async ({ id, status }: { id: number; status: string }) => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await axios.put(`/api/reservations/${id}`, 
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * AdminDashboard Component
 * 
 * Functional dashboard with:
 * - Real-time KPI calculations
 * - Interactive appointments table with status management
 * - Functional calendar with event navigation
 * - Tab-based filtering (Today, This Month, This Year)
 * - Quick actions and status updates
 */
function AdminDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const queryClient = useQueryClient();
  // const { withLoading } = useGlobalLoading(); // Removed as per edit hint

  // Fetch data from existing APIs
  const {
    data: services,
    isLoading: servicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  const {
    data: reservations,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: ['reservations'],
    queryFn: fetchReservations,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const {
    data: employees,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  // Mutation for updating reservation status
  const updateStatusMutation = useMutation({
    mutationFn: updateReservationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setIsEditDialogOpen(false);
      setSelectedReservation(null);
    },
  });

  // Extract reservations array from API response (moved before early return)
  const reservationsArray = reservations?.success ? 
    (reservations.data?.data || []) : [];
  
  const employeesArray = employees?.success ? (employees.data || []) : [];
  const servicesArray = services || [];

  // Calculate dashboard statistics with real data (moved before early return)
  const stats = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfThisMonth = startOfMonth(today);
    const startOfThisYear = new Date(today.getFullYear(), 0, 1);

    const todayReservations = reservationsArray.filter((r: any) => {
      const reservationDate = new Date(r.start_at);
      return reservationDate >= startOfToday && reservationDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    });

    const thisMonthReservations = reservationsArray.filter((r: any) => {
      const reservationDate = new Date(r.start_at);
      return reservationDate >= startOfThisMonth;
    });

    const thisYearReservations = reservationsArray.filter((r: any) => {
      const reservationDate = new Date(r.start_at);
      return reservationDate >= startOfThisYear;
    });

    const newClientsThisMonth = new Set(
      thisMonthReservations.map((r: any) => r.client_id)
    ).size;

    return {
      totalReservations: reservationsArray.length,
      todayReservations: todayReservations.length,
      thisMonthReservations: thisMonthReservations.length,
      thisYearReservations: thisYearReservations.length,
      newClientsThisMonth,
      totalEmployees: employeesArray.length,
      totalServices: servicesArray.length,
    };
  }, [reservationsArray, employeesArray, servicesArray]);

  // Filter reservations based on selected tab (moved before early return)
  const filteredReservations = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisMonth = startOfMonth(now);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    switch (tabValue) {
      case 0: // Today
        return reservationsArray.filter((r: any) => {
          const reservationDate = new Date(r.start_at);
          return reservationDate >= startOfToday && reservationDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
        });
      case 1: // This Month
        return reservationsArray.filter((r: any) => {
          const reservationDate = new Date(r.start_at);
          return reservationDate >= startOfThisMonth;
        });
      case 2: // This Year
        return reservationsArray.filter((r: any) => {
          const reservationDate = new Date(r.start_at);
          return reservationDate >= startOfThisYear;
        });
      default:
        return reservationsArray;
    }
  }, [reservationsArray, tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    setNewStatus(reservation.status);
    setIsEditDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedReservation && newStatus) {
      updateStatusMutation.mutate({
        id: selectedReservation.id,
        status: newStatus,
      });
    }
  };

  // Refresh all data with global loading screen
  // Function moved to AdminLayout header

  // Error and loading handling (moved after all hooks)
  const isLoading = servicesLoading || reservationsLoading || employeesLoading;
  const hasError = servicesError || reservationsError || employeesError;

  if (hasError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erreur lors du chargement des données du tableau de bord
        </Alert>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'REQUESTED': return 'warning';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmé';
      case 'REQUESTED': return 'Demandé';
      case 'CANCELLED': return 'Annulé';
      case 'COMPLETED': return 'Terminé';
      default: return status;
    }
  };

  return (
    <Box>


      {/* KPI Summary Strip with Real Data */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1, py: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              TOTAL
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Rendez-vous
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {isLoading ? <CircularProgress size={24} /> : stats.totalReservations}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, py: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              AUJOURD'HUI
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Rendez-vous
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {isLoading ? <CircularProgress size={24} /> : stats.todayReservations}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, py: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              CE MOIS
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Nouveaux clients
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {isLoading ? <CircularProgress size={24} /> : stats.newClientsThisMonth}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, py: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              TOTAL
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Services
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {isLoading ? <CircularProgress size={24} /> : stats.totalServices}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left Column - Functional Appointments Table */}
        <Box sx={{ flex: '2 1 400px', minWidth: '400px' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Liste des rendez-vous
          </Typography>

          {/* Functional Tabs with Dynamic Counts */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="standard"
            sx={{ mb: 2 }}
          >
            <Tab 
              label={`AUJOURD'HUI (${stats.todayReservations})`}
              disabled={isLoading}
            />
            <Tab 
              label={`CE MOIS (${stats.thisMonthReservations})`}
              disabled={isLoading}
            />
            <Tab 
              label={`CETTE ANNÉE (${stats.thisYearReservations})`}
              disabled={isLoading}
            />
          </Tabs>

          {/* Real Data Table */}
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Heure</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Employé</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      Aucun rendez-vous pour cette période
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.slice(0, 10).map((reservation: any) => (
                    <TableRow
                      key={reservation.id}
                      sx={{
                        height: 60,
                        '&:hover': {
                          bgcolor: '#f7f7f7',
                        },
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {format(new Date(reservation.start_at), 'dd/MM/yyyy', { locale: fr })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(reservation.start_at), 'HH:mm', { locale: fr })} - {format(new Date(reservation.end_at), 'HH:mm', { locale: fr })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {reservation.client?.full_name?.charAt(0) || 'C'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {reservation.client?.full_name || 'Client'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {reservation.client?.email || 'email@example.com'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {reservation.service?.name || 'Service'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.service?.duration_min || 30} min - {reservation.service?.price_dhs || 0} DHS
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {reservation.employee?.full_name || 'Employé'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(reservation.status)}
                          color={getStatusColor(reservation.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Modifier le statut">
                            <IconButton
                              size="small"
                              onClick={() => handleEditReservation(reservation)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Appeler le client">
                            <IconButton size="small">
                              <Phone fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Right Sidebar - Interactive Calendar */}
        <Box sx={{ flex: '0 0 240px', width: 240 }}>
          {/* Action Button */}
          <Button
            variant="contained"
            startIcon={<Add />}
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => window.open('/admin/reservations', '_blank')}
          >
            Nouveau rendez-vous
          </Button>

          {/* Enhanced Calendar with Holidays */}
          <EnhancedCalendar 
            reservations={reservationsArray}
            employees={employeesArray}
            compact={true}
            onDateClick={(date) => {
              console.log('Calendar date clicked:', date);
              // Could navigate to detailed day view or reservations page
            }}
          />
        </Box>
      </Box>

      {/* Edit Reservation Status Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Modifier le statut du rendez-vous</DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Client: {selectedReservation?.client?.full_name}
            </Typography>
            <TextField
              select
              fullWidth
              label="Nouveau statut"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="REQUESTED">Demandé</MenuItem>
              <MenuItem value="CONFIRMED">Confirmé</MenuItem>
              <MenuItem value="COMPLETED">Terminé</MenuItem>
              <MenuItem value="CANCELLED">Annulé</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleStatusUpdate}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? <CircularProgress size={20} /> : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard; 