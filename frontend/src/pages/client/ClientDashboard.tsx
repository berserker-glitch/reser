import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  useTheme,
  useMediaQuery,
  Fab,
  Grid,
  Stack,
  IconButton,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  ContentCut,
  Add,
  Cancel,
  Phone,
  Email,
  Refresh,
  TrendingUp,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

// API functions
const fetchClientReservations = async () => {
  const token = localStorage.getItem('client_token');
  if (!token) throw new Error('No token found');

  const response = await axios.get('http://127.0.0.1:8000/api/reservations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  return response.data;
};

const cancelReservation = async (reservationId: number) => {
  const token = localStorage.getItem('client_token');
  if (!token) throw new Error('No token found');

  const response = await axios.put(
    `http://127.0.0.1:8000/api/reservations/${reservationId}`,
    { status: 'CANCELLED' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  return response.data;
};

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
    case 'REQUESTED': return 'En attente';
    case 'CANCELLED': return 'Annulé';
    case 'COMPLETED': return 'Terminé';
    default: return status;
  }
};

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  // Get user data
  const clientUser = localStorage.getItem('client_user');
  const user = clientUser ? JSON.parse(clientUser) : null;

  // Check for success message from navigation state
  const successMessage = location.state?.success;

  // Fetch reservations
  const {
    data: reservationsData,
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch: refetchReservations,
  } = useQuery({
    queryKey: ['client-reservations'],
    queryFn: fetchClientReservations,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Cancel reservation mutation
  const cancelMutation = useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-reservations'] });
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    },
  });

  // Extract reservations array
  const reservations = reservationsData?.success ? 
    (Array.isArray(reservationsData.data?.data) ? reservationsData.data.data : 
     Array.isArray(reservationsData.data) ? reservationsData.data : []) : [];

  // Filter reservations
  const now = new Date();
  const upcomingReservations = reservations.filter((reservation: any) => 
    isAfter(new Date(reservation.start_at), now) && reservation.status !== 'CANCELLED'
  );
  const recentReservations = reservations
    .filter((reservation: any) => 
      isBefore(new Date(reservation.start_at), now) || reservation.status === 'COMPLETED'
    )
    .slice(0, 3);

  const handleCancelClick = (reservation: any) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (selectedReservation) {
      cancelMutation.mutate(selectedReservation.id);
    }
  };

  const canCancelReservation = (reservation: any) => {
    // Can cancel if reservation is confirmed and starts more than 2 hours from now
    return reservation.status === 'CONFIRMED' && 
           isAfter(new Date(reservation.start_at), addHours(now, 2));
  };

  // Calculate stats
  const stats = {
    upcoming: upcomingReservations.length,
    completed: reservations.filter((r: any) => r.status === 'COMPLETED').length,
    total: reservations.length,
  };

  if (reservationsLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column',
        gap: 2,
      }}>
        <CircularProgress size={40} />
        <Typography color="text.secondary">Chargement...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 3, px: isMobile ? 2 : 3 }}>
      {/* Success Message */}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => window.history.replaceState({}, document.title)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Welcome Section */}
      <Paper 
        sx={{ 
          p: isMobile ? 3 : 4, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar 
            sx={{ 
              width: isMobile ? 48 : 60, 
              height: isMobile ? 48 : 60, 
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              fontWeight: 700,
            }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 0.5 }}>
              Bonjour, {user?.full_name?.split(' ')[0] || 'Client'} ! 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Gérez vos rendez-vous et réservez de nouveaux créneaux
            </Typography>
          </Box>
          {!isMobile && (
            <IconButton 
              color="inherit" 
              onClick={() => refetchReservations()}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              <Refresh />
            </IconButton>
          )}
        </Box>

        {/* Quick Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 2, 
          mt: 2 
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.upcoming}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              À venir
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.completed}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Terminés
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {reservationsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors du chargement des réservations. Veuillez réessayer.
        </Alert>
      )}

      {/* Quick Actions */}
      {isMobile && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
              }}
              onClick={() => navigate('/client/booking')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                  <Add />
                </Avatar>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Réserver
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
              }}
              onClick={() => navigate('/client/history')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                  <Schedule />
                </Avatar>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Historique
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Upcoming Reservations */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Prochains rendez-vous ({upcomingReservations.length})
            </Typography>
            {isMobile && (
              <IconButton onClick={() => refetchReservations()} size="small">
                <Refresh />
              </IconButton>
            )}
          </Box>

          {upcomingReservations.length === 0 ? (
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: isMobile ? 4 : 6 }}>
                <CalendarToday sx={{ fontSize: isMobile ? 48 : 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Aucun rendez-vous prévu
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Réservez votre prochain rendez-vous dès maintenant
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => navigate('/client/booking')}
                  sx={{ borderRadius: 3 }}
                >
                  Réserver maintenant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={2} sx={{ mb: 3 }}>
              {upcomingReservations.map((reservation: any) => (
                <Card 
                  key={reservation.id} 
                  elevation={2}
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: 4 },
                  }}
                >
                  <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mt: 0.5 }}>
                        <ContentCut />
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {reservation.service?.name}
                        </Typography>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(reservation.start_at), 'EEEE dd MMMM yyyy', { locale: fr })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(reservation.start_at), 'HH:mm')} - {format(new Date(reservation.end_at), 'HH:mm')}
                            </Typography>
                          </Box>
                          {reservation.employee && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {reservation.employee.full_name}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 1 }}>
                        <Chip
                          label={getStatusLabel(reservation.status)}
                          color={getStatusColor(reservation.status) as any}
                          size="small"
                        />
                        {canCancelReservation(reservation) && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<Cancel />}
                            onClick={() => handleCancelClick(reservation)}
                            sx={{ borderRadius: 2 }}
                          >
                            Annuler
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions for Desktop */}
          {!isMobile && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Actions rapides
                </Typography>
                <Stack spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<Add />}
                    onClick={() => navigate('/client/booking')}
                    sx={{ borderRadius: 2 }}
                  >
                    Nouveau rendez-vous
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<CalendarToday />}
                    onClick={() => navigate('/client/history')}
                    sx={{ borderRadius: 2 }}
                  >
                    Voir l'historique
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Recent History */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Historique récent
              </Typography>
              {recentReservations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Aucun historique disponible
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {recentReservations.map((reservation: any, index: number) => (
                    <Box key={reservation.id}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {reservation.service?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {format(new Date(reservation.start_at), 'dd/MM/yyyy HH:mm')}
                      </Typography>
                      <Chip
                        label={getStatusLabel(reservation.status)}
                        color={getStatusColor(reservation.status) as any}
                        size="small"
                      />
                      {index < recentReservations.length - 1 && (
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cancel Confirmation Dialog */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={() => setCancelDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Annuler le rendez-vous
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Êtes-vous sûr de vouloir annuler ce rendez-vous ?
          </Typography>
          {selectedReservation && (
            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  {selectedReservation.service?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(selectedReservation.start_at), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setCancelDialogOpen(false)}
            variant="outlined"
            fullWidth={isMobile}
          >
            Garder le rendez-vous
          </Button>
          <Button
            onClick={handleCancelConfirm}
            color="error"
            variant="contained"
            disabled={cancelMutation.isPending}
            fullWidth={isMobile}
          >
            {cancelMutation.isPending ? <CircularProgress size={20} /> : 'Annuler le rendez-vous'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClientDashboard; 