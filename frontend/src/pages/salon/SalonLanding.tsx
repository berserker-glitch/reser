import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  CalendarToday,
  LocationOn,
  Phone,
  Email,
  Schedule,
  Euro,
  ArrowForward,
  Star,
  People,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useBookingStore, type Salon, type Service, type Employee } from '../../store/bookingStore';
import { fetchSalonBySlug, type SalonDiscoveryResponse } from '../../services/salonApi';

/**
 * SalonLanding Component
 * 
 * The homepage for a specific salon that users see when they visit /salon/slug
 * Features:
 * - Salon information and branding
 * - Services showcase
 * - Employees showcase
 * - Call-to-action to start booking
 */
const SalonLanding: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const navigate = useNavigate();
  const { setSalon, clearBooking } = useBookingStore();

  // Fetch salon data
  const { 
    data: salonData, 
    isLoading, 
    error 
  } = useQuery<SalonDiscoveryResponse>({
    queryKey: ['salon', salonSlug],
    queryFn: () => fetchSalonBySlug(salonSlug!),
    enabled: !!salonSlug,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Set salon in booking store when data loads
  useEffect(() => {
    if (salonData?.salon) {
      const salon: Salon = {
        id: salonData.salon.id,
        name: salonData.salon.name,
        slug: salonData.salon.slug,
        description: salonData.salon.description,
        address: salonData.salon.address,
        phone: salonData.salon.phone,
        email: salonData.salon.email,
      };
      setSalon(salon);
    }
  }, [salonData, setSalon]);

  // Handle booking start
  const handleStartBooking = () => {
    // Clear any previous booking state
    clearBooking();
    
    // Set salon again to ensure fresh state
    if (salonData?.salon) {
      const salon: Salon = {
        id: salonData.salon.id,
        name: salonData.salon.name,
        slug: salonData.salon.slug,
        description: salonData.salon.description,
        address: salonData.salon.address,
        phone: salonData.salon.phone,
        email: salonData.salon.email,
      };
      setSalon(salon);
    }
    
    // Navigate to first step of booking flow
    navigate(`/salon/${salonSlug}/book/service`);
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'grey.50',
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Chargement du salon...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !salonData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'grey.50',
      }}>
        <Container maxWidth="sm">
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              Salon introuvable
            </Typography>
            <Typography variant="body2">
              Le salon que vous recherchez n'existe pas ou n'est plus disponible.
            </Typography>
          </Alert>
        </Container>
      </Box>
    );
  }

  const { salon, services, employees } = salonData;

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', zIndex: 1, position: 'relative' }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700, 
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              {salon.name}
            </Typography>
            
            {salon.description && (
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  maxWidth: 600,
                  mx: 'auto',
                  fontSize: { xs: '1.2rem', md: '1.5rem' }
                }}
              >
                {salon.description}
              </Typography>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={handleStartBooking}
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontSize: '1.2rem',
                py: 2,
                px: 4,
                borderRadius: 3,
                '&:hover': {
                  bgcolor: 'grey.100',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Réserver maintenant
            </Button>
          </Box>
        </Container>

        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
          }}
        />
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Salon Info Section */}
        <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={4}>
            {salon.address && (
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <LocationOn />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Adresse
                    </Typography>
                    <Typography variant="body1">
                      {salon.address}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            {salon.phone && (
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Phone />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Téléphone
                    </Typography>
                    <Typography variant="body1">
                      {salon.phone}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            {salon.email && (
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Email />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {salon.email}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Services Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
            Nos Services
          </Typography>
          
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={handleStartBooking}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                        {service.name}
                      </Typography>
                      <Chip 
                        label={`${service.price_dhs} DH`}
                        color="primary"
                        size="small"
                      />
                    </Box>

                    {service.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {service.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {service.duration_min} min
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Employees Section */}
        {employees.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
              Notre Équipe
            </Typography>
            
            <Grid container spacing={3}>
              {employees.map((employee) => (
                <Grid item xs={12} sm={6} md={4} key={employee.id}>
                  <Card 
                    elevation={2}
                    sx={{ 
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: 'primary.main',
                          fontSize: '2rem',
                        }}
                        src={employee.profile_picture}
                      >
                        {employee.full_name.charAt(0)}
                      </Avatar>
                      
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {employee.full_name}
                      </Typography>

                      {employee.services && employee.services.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                          {employee.services.slice(0, 3).map((service: any) => (
                            <Chip 
                              key={service.id}
                              label={service.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {employee.services.length > 3 && (
                            <Chip 
                              label={`+${employee.services.length - 3}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Call to Action */}
        <Paper 
          elevation={3}
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
            Prêt à réserver?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
            Choisissez votre service, sélectionnez votre employé préféré et trouvez le créneau parfait.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartBooking}
            endIcon={<CalendarToday />}
            sx={{
              fontSize: '1.1rem',
              py: 2,
              px: 4,
              borderRadius: 3,
            }}
          >
            Commencer la réservation
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default SalonLanding; 