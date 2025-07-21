import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Avatar,
  Chip,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  ContentCut,
  Search,
  FilterList,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

// API function
const fetchClientReservations = async () => {
  const token = localStorage.getItem('client_token');
  if (!token) throw new Error('No token found');

  const response = await axios.get('http://127.0.0.1:8000/api/reservations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  
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

const ClientHistory: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch reservations
  const {
    data: reservationsData,
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useQuery({
    queryKey: ['client-reservations'],
    queryFn: fetchClientReservations,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Extract reservations array
  const reservations = reservationsData?.success ? 
    (Array.isArray(reservationsData.data?.data) ? reservationsData.data.data : 
     Array.isArray(reservationsData.data) ? reservationsData.data : []) : [];

  // Filter reservations based on tab
  const now = new Date();
  const filteredReservations = reservations.filter((reservation: any) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        reservation.service?.name.toLowerCase().includes(searchLower) ||
        reservation.employee?.full_name.toLowerCase().includes(searchLower) ||
        getStatusLabel(reservation.status).toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Tab filter
    switch (tabValue) {
      case 0: // Tous
        return true;
      case 1: // À venir
        return isAfter(new Date(reservation.start_at), now) && reservation.status !== 'CANCELLED';
      case 2: // Passés
        return isBefore(new Date(reservation.start_at), now) || reservation.status === 'COMPLETED';
      case 3: // Annulés
        return reservation.status === 'CANCELLED';
      default:
        return true;
    }
  });

  // Sort reservations by date (most recent first)
  const sortedReservations = [...filteredReservations].sort((a, b) => 
    new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
  );

  const stats = {
    total: reservations.length,
    upcoming: reservations.filter((r: any) => 
      isAfter(new Date(r.start_at), now) && r.status !== 'CANCELLED'
    ).length,
    completed: reservations.filter((r: any) => r.status === 'COMPLETED').length,
    cancelled: reservations.filter((r: any) => r.status === 'CANCELLED').length,
  };

  if (reservationsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Historique des rendez-vous
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Consultez tous vos rendez-vous passés et à venir
        </Typography>
      </Paper>

      {/* Error Alert */}
      {reservationsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors du chargement de l'historique. Veuillez réessayer.
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {stats.upcoming}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                À venir
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Terminés
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {stats.cancelled}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Annulés
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par service, employé ou statut..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab label={`Tous (${stats.total})`} />
          <Tab label={`À venir (${stats.upcoming})`} />
          <Tab label={`Passés (${stats.completed})`} />
          <Tab label={`Annulés (${stats.cancelled})`} />
        </Tabs>
      </Paper>

      {/* Reservations List */}
      <Paper sx={{ p: 3 }}>
        {sortedReservations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm ? 'Aucun résultat trouvé' : 'Aucun rendez-vous'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? 'Essayez de modifier votre recherche'
                : 'Vous n\'avez pas encore de rendez-vous dans cette catégorie'
              }
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedReservations.map((reservation: any, index: number) => (
              <Card key={reservation.id} variant="outlined">
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ContentCut />
                      </Avatar>
                    </Grid>
                    <Grid item xs>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {reservation.service?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(reservation.start_at), 'EEEE dd MMMM yyyy', { locale: fr })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(reservation.start_at), 'HH:mm')} - {format(new Date(reservation.end_at), 'HH:mm')}
                          </Typography>
                        </Box>
                        {reservation.employee && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {reservation.employee.full_name}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Prix: {reservation.service?.price_dhs} DH
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 1 }}>
                        <Chip
                          label={getStatusLabel(reservation.status)}
                          color={getStatusColor(reservation.status) as any}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Réf: #{reservation.id}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClientHistory; 