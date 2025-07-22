import React, { useEffect, useState } from 'react';
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
  Paper,
} from '@mui/material';
import {
  CalendarToday,
  Schedule,
  ArrowForward,
  ChevronLeft,
  ChevronRight,
  AccessTime,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, isSameDay, isToday, startOfDay, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBookingStore } from '../../../store/bookingStore';
import { fetchAvailability, type AvailabilityResponse } from '../../../services/salonApi';
import BookingLayout from './BookingLayout';

/**
 * DateTimeSelection Component
 * 
 * Third step of the booking flow where users select their preferred date and time
 * Features:
 * - Calendar view with available dates
 * - Time slot picker for selected date
 * - Integration with salon availability API
 * - Working hours and holiday filtering
 */
const DateTimeSelection: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const navigate = useNavigate();
  
  const {
    salon,
    selectedService,
    selectedEmployee,
    selectedDateTime,
    setDateTime,
    setCurrentStep,
    canProceedToStep,
  } = useBookingStore();

  // Local state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Set current step
  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // Redirect if previous steps not completed
  useEffect(() => {
    if (!selectedService) {
      navigate(`/salon/${salonSlug}/book/service`);
      return;
    }
    if (selectedEmployee === undefined) {
      navigate(`/salon/${salonSlug}/book/employee`);
      return;
    }
  }, [selectedService, selectedEmployee, navigate, salonSlug]);

  // Generate date options (next 14 days)
  const dateOptions = React.useMemo(() => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  }, []);

  // Fetch availability for selected date
  const { 
    data: availability, 
    isLoading: availabilityLoading, 
    error: availabilityError 
  } = useQuery<AvailabilityResponse>({
    queryKey: ['availability', salonSlug, selectedService?.id, selectedEmployee?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => fetchAvailability(
      salonSlug!,
      selectedService!.id,
      format(selectedDate, 'yyyy-MM-dd'),
      selectedEmployee?.id
    ),
    enabled: !!salonSlug && !!selectedService && selectedDate !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    
    // Combine date and time
    const dateTimeString = `${format(selectedDate, 'yyyy-MM-dd')}T${time}`;
    setDateTime(dateTimeString);
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (selectedDateTime && canProceedToStep(4)) {
      setCurrentStep(4);
      navigate(`/salon/${salonSlug}/book/auth`);
    }
  };

  // Format time slots for display
  const formatTimeSlot = (datetime: string) => {
    const date = new Date(datetime);
    return format(date, 'HH:mm');
  };

  // Check if a date is selectable (not in the past)
  const isDateSelectable = (date: Date) => {
    return !isBefore(date, startOfDay(new Date()));
  };

  return (
    <BookingLayout
      title="Choisissez votre créneau"
      subtitle="Sélectionnez la date et l'heure qui vous conviennent"
      currentStep={3}
      showBackButton={true}
      showHomeButton={true}
    >
      <Box>
        {/* Booking Summary */}
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
              Résumé de votre réservation
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Service:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedService.name}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Employé:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedEmployee ? selectedEmployee.full_name : 'N\'importe quel employé disponible'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Durée:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedService.duration_min} minutes
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Prix:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedService.price_dhs} DH
                </Typography>
              </Box>
            </Box>
          </Card>
        )}

        {/* Date Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday color="primary" />
            Choisissez votre date
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: 2,
            mb: 4,
          }}>
            {dateOptions.map((date, index) => {
              const isSelected = isSameDay(date, selectedDate);
              const isSelectable = isDateSelectable(date);
              const dayOfWeek = format(date, 'EEE', { locale: fr });
              const dayNumber = format(date, 'd');
              const monthName = format(date, 'MMM', { locale: fr });
              
              return (
                <Button
                  key={index}
                  variant={isSelected ? 'contained' : 'outlined'}
                  onClick={() => handleDateSelect(date)}
                  disabled={!isSelectable}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    flexDirection: 'column',
                    gap: 0.5,
                    minHeight: 80,
                    textTransform: 'none',
                    border: isSelected ? '2px solid' : '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Typography variant="caption" color={isSelected ? 'primary.contrastText' : 'text.secondary'}>
                    {dayOfWeek}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {dayNumber}
                  </Typography>
                  <Typography variant="caption" color={isSelected ? 'primary.contrastText' : 'text.secondary'}>
                    {monthName}
                  </Typography>
                  {isToday(date) && (
                    <Chip 
                      label="Aujourd'hui" 
                      size="small" 
                      color={isSelected ? 'secondary' : 'primary'}
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  )}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Time Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime color="primary" />
            Choisissez votre heure pour le {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
          </Typography>

          {availabilityLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Chargement des créneaux disponibles...
              </Typography>
            </Box>
          )}

          {availabilityError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Impossible de charger les créneaux disponibles. Veuillez réessayer.
              </Typography>
            </Alert>
          )}

          {availability && availability.slots.length === 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Aucun créneau disponible
              </Typography>
              <Typography variant="body2">
                Aucun créneau n'est disponible pour cette date. Veuillez choisir une autre date.
              </Typography>
            </Alert>
          )}

          {availability && availability.slots.length > 0 && (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
              gap: 2,
            }}>
              {availability.slots.map((slot, index) => {
                const timeSlot = formatTimeSlot(slot);
                const isSelected = selectedTime === timeSlot;
                
                return (
                  <Button
                    key={index}
                    variant={isSelected ? 'contained' : 'outlined'}
                    onClick={() => handleTimeSelect(timeSlot)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      fontWeight: 600,
                      border: isSelected ? '2px solid' : '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    {timeSlot}
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Selected DateTime Summary */}
        {selectedDateTime && (
          <Card 
            elevation={1}
            sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: 'success.50',
              border: '1px solid',
              borderColor: 'success.200',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
              Créneau sélectionné
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })} à {selectedTime}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Durée: {selectedService?.duration_min} minutes
                </Typography>
              </Box>
              
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => {
                  setSelectedTime(null);
                  setDateTime(null);
                }}
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
            {selectedDateTime 
              ? 'Parfait! Continuez pour finaliser votre réservation.'
              : 'Sélectionnez une date et une heure pour continuer.'
            }
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={handleContinue}
            disabled={!selectedDateTime}
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

export default DateTimeSelection; 