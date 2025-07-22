import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  CalendarToday,
  Person,
  Schedule,
  LocationOn,
  Phone,
  Home,
  Receipt,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useBookingStore } from '../../../store/bookingStore';
import { confirmBooking } from '../../../services/reservationService';
import BookingLayout from './BookingLayout';

/**
 * BookingConfirmation Component
 * 
 * Final step of the booking flow where users confirm their reservation
 * Features:
 * - Complete booking summary
 * - Final confirmation button
 * - Success/error handling
 * - Booking reference display
 * - Next steps information
 */
const BookingConfirmation: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const navigate = useNavigate();
  
  const {
    salon,
    selectedService,
    selectedEmployee,
    selectedDateTime,
    tempBooking,
    clearBooking,
    setCurrentStep,
  } = useBookingStore();

  // Local state
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Set current step
  useEffect(() => {
    setCurrentStep(5);
  }, [setCurrentStep]);

  // Redirect if previous steps not completed
  useEffect(() => {
    if (!selectedService || !selectedDateTime || !tempBooking) {
      navigate(`/salon/${salonSlug}/book/service`);
      return;
    }
  }, [selectedService, selectedDateTime, tempBooking, navigate, salonSlug]);

  // Confirm booking mutation
  const confirmBookingMutation = useMutation({
    mutationFn: () => confirmBooking({
      service_id: selectedService!.id,
      employee_id: selectedEmployee?.id,
      start_at: selectedDateTime!,
    }),
    onSuccess: (response) => {
      setConfirmedBooking(response.data);
      setBookingConfirmed(true);
      
      // Redirect to client dashboard after 3 seconds
      setTimeout(() => {
        navigate('/client');
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Failed to confirm booking:', error);
    },
  });

  // Handle booking confirmation
  const handleConfirmBooking = () => {
    confirmBookingMutation.mutate();
  };

  // Handle navigation to salon home
  const handleGoToSalonHome = () => {
    clearBooking();
    navigate(`/salon/${salonSlug}`);
  };

  // Handle navigation to user dashboard
  const handleGoToDashboard = () => {
    clearBooking();
    navigate('/client/dashboard');
  };

  // Format date and time for display
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  if (bookingConfirmed && confirmedBooking) {
    // Success state
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}>
        <Box sx={{ maxWidth: 600, width: '100%' }}>
          {/* Success Card */}
          <Card elevation={4} sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircle 
                sx={{ 
                  fontSize: 80, 
                  color: 'success.main', 
                  mb: 2 
                }} 
              />
              
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'success.main' }}>
                Réservation confirmée !
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Votre réservation a été confirmée avec succès. 
                Vous recevrez un email de confirmation sous peu.
              </Typography>

              {/* Booking Reference */}
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  mb: 4, 
                  bgcolor: 'primary.50',
                  border: '1px solid',
                  borderColor: 'primary.200',
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Référence de réservation
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  #{confirmedBooking.id}
                </Typography>
              </Paper>

              {/* Booking Details */}
              <Box sx={{ textAlign: 'left', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Détails de votre réservation
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationOn color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Salon</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {salon?.name}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Receipt color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Service</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedService?.name}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Person color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Employé</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedEmployee ? selectedEmployee.full_name : 'N\'importe quel employé disponible'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarToday color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Date et heure</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatDateTime(selectedDateTime!).date}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        à {formatDateTime(selectedDateTime!).time}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Schedule color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Durée et prix</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedService?.duration_min} minutes • {selectedService?.price_dhs} DH
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGoToDashboard}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  Voir mes réservations
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGoToSalonHome}
                  startIcon={<Home />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  Retour au salon
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Que faire ensuite ?</strong><br />
              • Vous recevrez un email de confirmation<br />
              • Arrivez 5 minutes avant votre rendez-vous<br />
              • En cas d'empêchement, contactez le salon directement
            </Typography>
          </Alert>
        </Box>
      </Box>
    );
  }

  // Confirmation form state
  return (
    <BookingLayout
      title="Confirmer votre réservation"
      subtitle="Vérifiez les détails et confirmez votre réservation"
      currentStep={5}
      showBackButton={true}
      showHomeButton={true}
    >
      <Box>
        {/* Booking Summary */}
        <Card 
          elevation={2}
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'primary.main',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
              Résumé de votre réservation
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Salon Info */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {salon?.name}
                  </Typography>
                </Box>
                {salon?.address && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    {salon.address}
                  </Typography>
                )}
                {salon?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {salon.phone}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Service Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Service
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedService?.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Employé
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedEmployee ? selectedEmployee.full_name : 'N\'importe quel employé disponible'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDateTime(selectedDateTime!).date}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Heure
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDateTime(selectedDateTime!).time}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Durée
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedService?.duration_min} minutes
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Prix total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {selectedService?.price_dhs} DH
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Temporary Booking Info */}
        {tempBooking && (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="body2">
              <strong>Réservation temporaire créée</strong><br />
              Votre créneau est réservé temporairement. Confirmez maintenant pour finaliser votre réservation.
            </Typography>
          </Alert>
        )}

        {/* Confirmation Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleConfirmBooking}
            disabled={confirmBookingMutation.isPending}
            startIcon={confirmBookingMutation.isPending ? <CircularProgress size={20} /> : <CheckCircle />}
            sx={{
              py: 2,
              px: 6,
              borderRadius: 3,
              fontSize: '1.2rem',
              fontWeight: 700,
              textTransform: 'none',
              minWidth: 250,
            }}
          >
            {confirmBookingMutation.isPending ? 'Confirmation...' : 'Confirmer ma réservation'}
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            En confirmant, vous acceptez les conditions du salon
          </Typography>
        </Box>

        {/* Error handling */}
        {confirmBookingMutation.isError && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Une erreur est survenue lors de la confirmation de votre réservation. 
              Veuillez réessayer ou contacter le salon directement.
            </Typography>
          </Alert>
        )}
      </Box>
    </BookingLayout>
  );
};

export default BookingConfirmation; 