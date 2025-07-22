import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Schedule,
  Euro,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useBookingStore, type Service } from '../../../store/bookingStore';
import { fetchSalonBySlug, type SalonDiscoveryResponse } from '../../../services/salonApi';
import BookingLayout from './BookingLayout';

/**
 * ServiceSelection Component
 * 
 * First step of the booking flow where users select their desired service
 * Features:
 * - Display all available services for the salon
 * - Service details (name, description, duration, price)
 * - Single selection with visual feedback
 * - Continue to next step when service is selected
 */
const ServiceSelection: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const navigate = useNavigate();
  
  const {
    salon,
    selectedService,
    setService,
    setCurrentStep,
    canProceedToStep,
  } = useBookingStore();

  // Fetch salon data if not already loaded
  const { 
    data: salonData, 
    isLoading, 
    error 
  } = useQuery<SalonDiscoveryResponse>({
    queryKey: ['salon', salonSlug],
    queryFn: () => fetchSalonBySlug(salonSlug!),
    enabled: !!salonSlug && !salon,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Set current step
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  const services = salonData?.services || [];

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    const serviceData: Service = {
      id: service.id,
      name: service.name,
      description: service.description,
      duration_min: service.duration_min,
      price_dhs: service.price_dhs,
      salon_id: service.salon_id,
    };
    
    setService(serviceData);
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (selectedService && canProceedToStep(2)) {
      setCurrentStep(2);
      navigate(`/salon/${salonSlug}/book/employee`);
    }
  };

  // Handle going back to salon homepage
  const handleBackToSalon = () => {
    navigate(`/salon/${salonSlug}`);
  };

  if (isLoading) {
    return (
      <BookingLayout
        title="Choisissez votre service"
        subtitle="Sélectionnez le service que vous souhaitez réserver"
        currentStep={1}
        showBackButton={true}
        showHomeButton={true}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Chargement des services...
            </Typography>
          </Box>
        </Box>
      </BookingLayout>
    );
  }

  if (error || !salonData) {
    return (
      <BookingLayout
        title="Erreur"
        currentStep={1}
        showBackButton={true}
        showHomeButton={true}
      >
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Impossible de charger les services
          </Typography>
          <Typography variant="body2">
            Une erreur s'est produite lors du chargement des services. Veuillez réessayer.
          </Typography>
        </Alert>
        <Button
          variant="outlined"
          onClick={handleBackToSalon}
          sx={{ mt: 2 }}
        >
          Retour au salon
        </Button>
      </BookingLayout>
    );
  }

  if (services.length === 0) {
    return (
      <BookingLayout
        title="Aucun service disponible"
        subtitle="Ce salon n'a pas encore configuré ses services"
        currentStep={1}
        showBackButton={true}
        showHomeButton={true}
      >
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Aucun service disponible
          </Typography>
          <Typography variant="body2">
            Ce salon n'a pas encore configuré ses services. Veuillez contacter le salon directement.
          </Typography>
        </Alert>
        <Button
          variant="outlined"
          onClick={handleBackToSalon}
          sx={{ mt: 2 }}
        >
          Retour au salon
        </Button>
      </BookingLayout>
    );
  }

  return (
    <BookingLayout
      title="Choisissez votre service"
      subtitle={`Sélectionnez le service que vous souhaitez réserver chez ${salon?.name || 'ce salon'}`}
      currentStep={1}
      showBackButton={true}
      showHomeButton={true}
    >
      <Box>
        {/* Service Selection */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
          gap: 3, 
          mb: 4 
        }}>
          {services.map((service) => {
            const isSelected = selectedService?.id === service.id;
            
            return (
              <Box key={service.id}>
                <Card 
                  elevation={isSelected ? 4 : 2}
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    border: isSelected ? '2px solid' : '2px solid transparent',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    transition: 'all 0.3s ease',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleServiceSelect(service)}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 1,
                      }}
                    >
                      <CheckCircle color="primary" />
                    </Box>
                  )}

                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Service name and price */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          flex: 1, 
                          mr: 1,
                          color: isSelected ? 'primary.main' : 'text.primary',
                        }}
                      >
                        {service.name}
                      </Typography>
                      <Chip 
                        label={`${service.price_dhs} DH`}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    {/* Service description */}
                    {service.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 3, flex: 1 }}
                      >
                        {service.description}
                      </Typography>
                    )}

                    {/* Service details */}
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Schedule fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Durée: {service.duration_min} minutes
                        </Typography>
                      </Box>

                      {/* Selection button */}
                      <Button
                        variant={isSelected ? 'contained' : 'outlined'}
                        fullWidth
                        sx={{ 
                          mt: 2,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceSelect(service);
                        }}
                      >
                        {isSelected ? 'Service sélectionné' : 'Sélectionner ce service'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

        {/* Selected Service Summary */}
        {selectedService && (
          <Card 
            elevation={1}
            sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.200',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              Service sélectionné
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {selectedService.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedService.duration_min} minutes • {selectedService.price_dhs} DH
                </Typography>
              </Box>
              
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => setService(null)}
                sx={{ minWidth: 'auto' }}
              >
                Changer
              </Button>
            </Box>
          </Card>
        )}

        {/* Continue Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {selectedService 
              ? 'Parfait! Continuez pour choisir votre employé.'
              : 'Sélectionnez un service pour continuer.'
            }
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={handleContinue}
            disabled={!selectedService}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Continuer
          </Button>
        </Box>
      </Box>
    </BookingLayout>
  );
};

export default ServiceSelection; 