import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Avatar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
  Slide,
  AppBar,
  Toolbar,
  Stack,
  Container,
  Fade,
  Zoom,
  Grid,
} from '@mui/material';
import {
  ContentCut,
  Person,
  AccessTime,
  ArrowBack,
  ArrowForward,
  Check,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  Close,
  Schedule,
  Euro,
  Star,
  LocationOn,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addMinutes,
  isAfter
} from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { getCalendarAroundDate } from '../../services/calendarService';
import { useSalonId } from '../../hooks/useSalonContext';
import type { CalendarDay } from '../../services/calendarService';

// Types
interface Service {
  id: number;
  name: string;
  description: string;
  duration_min: number;
  price_dhs: string;
}

interface Employee {
  id: number;
  full_name: string;
  phone?: string;
}

interface BookingData {
  serviceId: number | null;
  employeeId: number | null;
  dateTime: Date | null;
}

// API functions
const fetchServices = async (salonId: number) => {
  const params = new URLSearchParams({
    salon_id: salonId.toString()
  });
  
  const response = await axios.get(`http://127.0.0.1:8000/api/services?${params.toString()}`);
  return response.data;
};

const fetchEmployees = async (salonId: number) => {
  const params = new URLSearchParams({
    salon_id: salonId.toString()
  });
  
  const response = await axios.get(`http://127.0.0.1:8000/api/employees?${params.toString()}`);
  return response.data;
};

const fetchAvailability = async (serviceId: number, employeeId?: number, date?: string) => {
  const params = new URLSearchParams({
    service_id: serviceId.toString(),
    ...(employeeId && { employee_id: employeeId.toString() }),
    ...(date && { date }),
  });
  
  const response = await axios.get(`http://127.0.0.1:8000/api/availability?${params}`);
  return response.data;
};

const createReservation = async (bookingData: BookingData) => {
  const token = localStorage.getItem('client_token');
  const response = await axios.post(
    'http://127.0.0.1:8000/api/reservations',
    {
      service_id: bookingData.serviceId,
      employee_id: bookingData.employeeId,
      start_at: bookingData.dateTime?.toISOString(),
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

const steps = ['Service', 'Coiffeur', 'Date & Heure', 'Confirmation'];

const Transition = React.forwardRef(function Transition(
  props: any,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: null,
    employeeId: null,
    dateTime: null,
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [calendarAvailability, setCalendarAvailability] = useState<Map<string, CalendarDay>>(new Map());

  const salonId = useSalonId();

  // Fetch services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', salonId],
    queryFn: () => fetchServices(salonId),
  });

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', salonId],
    queryFn: () => fetchEmployees(salonId),
    enabled: bookingData.serviceId !== null,
  });

  // Fetch availability
  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['availability', bookingData.serviceId, bookingData.employeeId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => fetchAvailability(
      bookingData.serviceId!,
      bookingData.employeeId || undefined,
      format(selectedDate, 'yyyy-MM-dd')
    ),
    enabled: bookingData.serviceId !== null && activeStep === 2,
  });

  // Fetch calendar availability for booking restrictions
  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['calendar-availability', salonId, format(calendarDate, 'yyyy-MM-dd')],
    queryFn: () => getCalendarAroundDate(salonId, format(calendarDate, 'yyyy-MM-dd'), 15, 45),
    enabled: activeStep === 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update calendar availability map when data changes
  useEffect(() => {
    if (calendarData?.data) {
      const availabilityMap = new Map<string, CalendarDay>();
      calendarData.data.forEach((day: CalendarDay) => {
        availabilityMap.set(day.date, day);
      });
      setCalendarAvailability(availabilityMap);
      
      console.debug('Calendar availability loaded', {
        totalDays: calendarData.data.length,
        bookableDays: calendarData.summary.bookable_days,
        centerDate: format(calendarDate, 'yyyy-MM-dd')
      });
    }
  }, [calendarData, calendarDate]);

  // Create reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-reservations'] });
      navigate('/client', { 
        state: { 
          success: `Réservation confirmée ! Référence: #${data.data?.id}` 
        } 
      });
    },
  });

  const servicesArray = Array.isArray(services) ? services : [];
  const employeesArray = Array.isArray(employeesData?.success ? employeesData.data : employeesData) ? 
    (employeesData?.success ? employeesData.data : employeesData) : [];
  const availableSlots = availability?.data?.slots || [];

  const handleNext = () => {
    if (activeStep === 2 && !showTimeSlots) {
      setShowTimeSlots(true);
    } else if (activeStep === steps.length - 1) {
      setConfirmationOpen(true);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      if (activeStep === 1) {
        setShowTimeSlots(false);
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 2 && showTimeSlots) {
      setShowTimeSlots(false);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleServiceSelect = (serviceId: number) => {
    setBookingData(prev => ({
      ...prev,
      serviceId,
      employeeId: null,
      dateTime: null,
    }));
  };

  const handleEmployeeSelect = (employeeId: number) => {
    setBookingData(prev => ({
      ...prev,
      employeeId,
      dateTime: null,
    }));
  };

  const handleDateSelect = (date: Date) => {
    // Check if the date is bookable before allowing selection
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayAvailability = calendarAvailability.get(dateStr);
    
    if (!dayAvailability?.is_bookable) {
      console.warn('Attempted to select non-bookable date:', {
        date: dateStr,
        isBookable: dayAvailability?.is_bookable,
        isWorkingDay: dayAvailability?.is_working_day,
        isHoliday: dayAvailability?.is_holiday,
        holidayName: dayAvailability?.holiday_name
      });
      return;
    }

    console.debug('Date selected successfully:', {
      date: dateStr,
      dayName: dayAvailability.day_name,
      workingHours: dayAvailability.working_hours
    });

    setSelectedDate(date);
    setBookingData(prev => ({
      ...prev,
      dateTime: null,
    }));
  };

  const handleTimeSelect = (slot: string) => {
    try {
      // Parse the slot string - it should be in ISO format from the API
      const dateTime = new Date(slot);
      
      // Validate the date
      if (isNaN(dateTime.getTime())) {
        console.error('Invalid time slot:', slot);
        return;
      }
      
      setBookingData(prev => ({
        ...prev,
        dateTime,
      }));
    } catch (error) {
      console.error('Error selecting time slot:', error);
    }
  };

  const handleConfirmReservation = () => {
    createReservationMutation.mutate(bookingData);
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0: return bookingData.serviceId !== null;
      case 1: return bookingData.employeeId !== null;
      case 2: return showTimeSlots ? bookingData.dateTime !== null : selectedDate !== null;
      case 3: return true;
      default: return false;
    }
  };

  const selectedService = servicesArray.find((s: Service) => s.id === bookingData.serviceId);
  const selectedEmployee = employeesArray.find((e: Employee) => e.id === bookingData.employeeId);

  // Calendar generation
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(calendarDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(calendarDate), { weekStartsOn: 1 });
    
    const days = [];
    let day = start;
    
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pb: isMobile ? 10 : 0,
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate('/client')}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Réserver un rendez-vous
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Container maxWidth="md" sx={{ py: isMobile ? 2 : 4 }}>
        {/* Desktop Header */}
        {!isMobile && (
          <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
                <ContentCut sx={{ fontSize: 32 }} />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Réservez votre rendez-vous
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Un processus simple en 4 étapes
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Progress Stepper */}
        <Paper sx={{ p: isMobile ? 3 : 4, mb: 4, borderRadius: 3 }}>
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel={!isMobile}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{
              '& .MuiStepLabel-root .Mui-completed': {
                color: 'success.main',
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: 'primary.main',
              },
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel 
                  sx={{ 
                    '& .MuiStepLabel-label': { 
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      fontWeight: activeStep === index ? 600 : 400,
                    } 
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step Content */}
        <Box sx={{ minHeight: isMobile ? 500 : 600 }}>
          
          {/* Step 1: Service Selection */}
          {activeStep === 0 && (
            <Fade in timeout={300}>
              <Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                  Choisissez votre service
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
                  Sélectionnez le service qui vous intéresse
                </Typography>
                
                {servicesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={48} />
                  </Box>
                ) : (
                  <Stack spacing={3}>
                    {servicesArray.map((service: Service) => (
                      <Zoom in timeout={300} key={service.id} style={{ transitionDelay: `${servicesArray.indexOf(service) * 100}ms` }}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: 2,
                            borderColor: bookingData.serviceId === service.id ? 'primary.main' : 'transparent',
                            bgcolor: bookingData.serviceId === service.id ? 'primary.50' : 'background.paper',
                            transition: 'all 0.3s ease',
                            borderRadius: 3,
                            '&:hover': { 
                              borderColor: 'primary.main',
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            },
                          }}
                          onClick={() => handleServiceSelect(service.id)}
                        >
                          <CardContent sx={{ p: isMobile ? 3 : 4 }}>
                            <Stack direction="row" spacing={3} alignItems="center">
                              <Avatar 
                                sx={{ 
                                  bgcolor: bookingData.serviceId === service.id ? 'primary.main' : 'primary.light',
                                  width: isMobile ? 56 : 70, 
                                  height: isMobile ? 56 : 70,
                                  boxShadow: 2,
                                }}
                              >
                                <ContentCut sx={{ fontSize: isMobile ? 24 : 32 }} />
                              </Avatar>
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                                  {service.name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                                  {service.description}
                                </Typography>
                                <Stack direction="row" spacing={2} flexWrap="wrap">
                                  <Chip 
                                    icon={<AccessTime />} 
                                    label={`${service.duration_min} min`} 
                                    size="medium"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                  />
                                  <Chip 
                                    icon={<Euro />}
                                    label={`${service.price_dhs} DH`} 
                                    size="medium"
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                  />
                                </Stack>
                              </Box>
                              {bookingData.serviceId === service.id && (
                                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                                  <Check />
                                </Avatar>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Zoom>
                    ))}
                  </Stack>
                )}
              </Box>
            </Fade>
          )}

          {/* Step 2: Employee Selection */}
          {activeStep === 1 && (
            <Fade in timeout={300}>
              <Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                  Choisissez votre coiffeur
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
                  Sélectionnez votre coiffeur préféré ou laissez-nous choisir
                </Typography>
                
                {employeesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={48} />
                  </Box>
                ) : (
                  <FormControl component="fieldset" sx={{ width: '100%' }}>
                    <RadioGroup
                      value={bookingData.employeeId || 'any'}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleEmployeeSelect(value === 'any' ? 0 : parseInt(value));
                      }}
                    >
                      <Zoom in timeout={300}>
                        <Card sx={{ 
                          mb: 3, 
                          border: bookingData.employeeId === 0 ? 3 : 2, 
                          borderColor: bookingData.employeeId === 0 ? 'primary.main' : 'divider',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 4,
                          }
                        }}>
                          <CardContent sx={{ p: isMobile ? 3 : 4 }}>
                            <FormControlLabel
                              value="any"
                              control={<Radio />}
                              label={
                                <Stack direction="row" spacing={3} alignItems="center" sx={{ py: 1, width: '100%' }}>
                                  <Avatar sx={{ bgcolor: 'grey.400', width: isMobile ? 56 : 70, height: isMobile ? 56 : 70 }}>
                                    <Person sx={{ fontSize: isMobile ? 24 : 32 }} />
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      Aucune préférence
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Le premier coiffeur disponible pour votre créneau
                                    </Typography>
                                    <Chip label="Recommandé" color="primary" size="small" sx={{ mt: 1, borderRadius: 2 }} />
                                  </Box>
                                </Stack>
                              }
                              sx={{ m: 0, width: '100%' }}
                            />
                          </CardContent>
                        </Card>
                      </Zoom>
                      
                      {employeesArray.map((employee: Employee, index: number) => (
                        <Zoom in timeout={300} key={employee.id} style={{ transitionDelay: `${(index + 1) * 100}ms` }}>
                          <Card sx={{ 
                            mb: 3, 
                            border: bookingData.employeeId === employee.id ? 3 : 2, 
                            borderColor: bookingData.employeeId === employee.id ? 'primary.main' : 'divider',
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 4,
                            }
                          }}>
                            <CardContent sx={{ p: isMobile ? 3 : 4 }}>
                              <FormControlLabel
                                value={employee.id.toString()}
                                control={<Radio />}
                                label={
                                  <Stack direction="row" spacing={3} alignItems="center" sx={{ py: 1, width: '100%' }}>
                                    <Avatar 
                                      sx={{ 
                                        bgcolor: 'primary.main', 
                                        width: isMobile ? 56 : 70, 
                                        height: isMobile ? 56 : 70 
                                      }}
                                      src={employee.profile_picture}
                                    >
                                      {!employee.profile_picture && <Person sx={{ fontSize: isMobile ? 24 : 32 }} />}
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {employee.full_name}
                                      </Typography>
                                      {employee.note && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                          {employee.note}
                                        </Typography>
                                      )}
                                      <Stack direction="row" spacing={1}>
                                        <Chip 
                                          icon={<Star />} 
                                          label="Expérimenté" 
                                          size="small" 
                                          color="warning" 
                                          variant="outlined"
                                          sx={{ borderRadius: 2 }}
                                        />
                                      </Stack>
                                    </Box>
                                  </Stack>
                                }
                                sx={{ m: 0, width: '100%' }}
                              />
                            </CardContent>
                          </Card>
                        </Zoom>
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
              </Box>
            </Fade>
          )}

          {/* Step 3: Date & Time Selection */}
          {activeStep === 2 && (
            <Fade in timeout={300}>
              <Box>
                {!showTimeSlots ? (
                  // Calendar View
                  <Box>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                      Choisissez une date
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
                      Sélectionnez votre date préférée
                    </Typography>
                    
                    {/* Calendar Header */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                        <IconButton 
                          onClick={() => setCalendarDate(subWeeks(calendarDate, 4))}
                          sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                        >
                          <ChevronLeft />
                        </IconButton>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {format(calendarDate, 'MMMM yyyy', { locale: fr })}
                        </Typography>
                        <IconButton 
                          onClick={() => setCalendarDate(addWeeks(calendarDate, 4))}
                          sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                        >
                          <ChevronRight />
                        </IconButton>
                      </Stack>
                      
                      {/* Calendar Grid */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                        {/* Day Headers */}
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                          <Box key={day} sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {day}
                            </Typography>
                          </Box>
                        ))}
                        
                        {/* Calendar Days */}
                        {calendarDays.map((day, index) => {
                          const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                          const isPast = isBefore(day, startOfDay(new Date()));
                          const isSelected = isSameDay(day, selectedDate);
                          const dayIsToday = isToday(day);
                          
                          // Get availability data for this day
                          const dayStr = format(day, 'yyyy-MM-dd');
                          const dayAvailability = calendarAvailability.get(dayStr);
                          
                          // Determine if day is bookable based on availability data
                          const isBookable = dayAvailability?.is_bookable ?? false;
                          const isWorkingDay = dayAvailability?.is_working_day ?? true; // Default to working day if no data
                          const isHoliday = dayAvailability?.is_holiday ?? false;
                          
                          // A day is clickable if it's in current month, not past, and bookable
                          const isClickable = isCurrentMonth && !isPast && isBookable;
                          
                          // Determine button styling based on day status
                          let buttonVariant: 'text' | 'outlined' | 'contained' = 'text';
                          if (isSelected) {
                            buttonVariant = 'contained';
                          } else if (dayIsToday) {
                            buttonVariant = 'outlined';
                          }
                          
                          // Determine button color and styling
                          let buttonColor = 'inherit';
                          let backgroundColor = 'transparent';
                          
                          if (!isCurrentMonth) {
                            buttonColor = 'text.disabled';
                          } else if (isHoliday) {
                            buttonColor = 'error.main';
                            backgroundColor = 'error.50';
                          } else if (!isWorkingDay) {
                            buttonColor = 'text.disabled';
                            backgroundColor = 'grey.100';
                          } else if (isPast) {
                            buttonColor = 'text.disabled';
                          }
                          
                          return (
                            <Box key={index} sx={{ textAlign: 'center', position: 'relative' }}>
                              <Button
                                onClick={() => isClickable && handleDateSelect(day)}
                                disabled={!isClickable}
                                variant={buttonVariant}
                                sx={{
                                  minWidth: isMobile ? 40 : 50,
                                  height: isMobile ? 40 : 50,
                                  borderRadius: 2,
                                  fontSize: '1rem',
                                  fontWeight: isSelected ? 700 : 400,
                                  color: buttonColor,
                                  bgcolor: backgroundColor,
                                  position: 'relative',
                                  '&:hover': {
                                    bgcolor: isClickable ? 'primary.50' : backgroundColor,
                                    transform: isClickable ? 'scale(1.05)' : 'none',
                                  },
                                  '&:disabled': {
                                    bgcolor: backgroundColor,
                                    color: buttonColor,
                                  },
                                  transition: 'all 0.2s ease',
                                  // Add strikethrough for holidays and non-working days
                                  ...(isHoliday && {
                                    textDecoration: 'line-through',
                                    textDecorationColor: 'error.main',
                                    textDecorationThickness: '2px',
                                  }),
                                  ...(!isWorkingDay && !isHoliday && {
                                    opacity: 0.5,
                                  }),
                                }}
                                title={
                                  isHoliday 
                                    ? `Jour férié: ${dayAvailability?.holiday_name || 'Fermeture'}`
                                    : !isWorkingDay 
                                    ? 'Jour non travaillé'
                                    : isPast 
                                    ? 'Date passée'
                                    : isBookable 
                                    ? 'Disponible pour réservation'
                                    : 'Non disponible'
                                }
                              >
                                {format(day, 'd')}
                              </Button>
                              
                              {/* Visual indicators */}
                              {isHoliday && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'error.main',
                                    zIndex: 1,
                                  }}
                                />
                              )}
                              {!isWorkingDay && !isHoliday && isCurrentMonth && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'grey.400',
                                    zIndex: 1,
                                  }}
                                />
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                      
                      {/* Calendar Legend */}
                      <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                          Légende du calendrier :
                        </Typography>
                        <Stack direction="row" spacing={4} flexWrap="wrap" justifyContent="center">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                            <Typography variant="caption" color="text.secondary">
                              Jours fériés
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'grey.400' }} />
                            <Typography variant="caption" color="text.secondary">
                              Jours fermés
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: 'success.main',
                              border: '1px solid',
                              borderColor: 'success.main'
                            }} />
                            <Typography variant="caption" color="text.secondary">
                              Jours disponibles
                            </Typography>
                          </Stack>
                        </Stack>
                      </Paper>

                      {selectedDate && (
                        <Alert 
                          severity={
                            calendarAvailability.get(format(selectedDate, 'yyyy-MM-dd'))?.is_bookable 
                              ? "success" 
                              : "warning"
                          } 
                          sx={{ mt: 2, borderRadius: 2 }}
                        >
                          <Typography sx={{ fontWeight: 600 }}>
                            Date sélectionnée: {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                          </Typography>
                          {calendarAvailability.get(format(selectedDate, 'yyyy-MM-dd'))?.is_holiday && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              ⚠️ Cette date est un jour férié ({calendarAvailability.get(format(selectedDate, 'yyyy-MM-dd'))?.holiday_name})
                            </Typography>
                          )}
                          {!calendarAvailability.get(format(selectedDate, 'yyyy-MM-dd'))?.is_working_day && 
                           !calendarAvailability.get(format(selectedDate, 'yyyy-MM-dd'))?.is_holiday && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              ⚠️ Le salon est fermé ce jour-là
                            </Typography>
                          )}
                        </Alert>
                      )}
                    </Paper>
                  </Box>
                ) : (
                  // Time Slots View
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                      <IconButton 
                        onClick={() => setShowTimeSlots(false)} 
                        sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                      >
                        <ArrowBack />
                      </IconButton>
                      <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          Créneaux disponibles
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                          {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                        </Typography>
                      </Box>
                    </Stack>
                    
                    {availabilityLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={48} />
                      </Box>
                    ) : availableSlots.length === 0 ? (
                      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                        <Schedule sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
                        <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                          Aucun créneau disponible
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                          Tous les créneaux sont réservés pour cette date
                        </Typography>
                        <Button 
                          variant="contained" 
                          size="large"
                          onClick={() => setShowTimeSlots(false)}
                          sx={{ borderRadius: 3 }}
                        >
                          Choisir une autre date
                        </Button>
                      </Paper>
                    ) : (
                      <Paper sx={{ p: 4, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                          Choisissez votre heure préférée
                        </Typography>
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, 
                          gap: 2 
                        }}>
                          {availableSlots.map((slot: string, index: number) => {
                            const slotTime = format(new Date(slot), 'HH:mm');
                            const selectedTime = bookingData.dateTime ? format(bookingData.dateTime, 'HH:mm') : null;
                            const isSelected = selectedTime === slotTime;
                            return (
                              <Zoom in timeout={300} key={slot} style={{ transitionDelay: `${index * 50}ms` }}>
                                <Button
                                  fullWidth
                                  variant={isSelected ? 'contained' : 'outlined'}
                                  onClick={() => handleTimeSelect(slot)}
                                  sx={{
                                    minHeight: 64,
                                    fontSize: '1.2rem',
                                    fontWeight: 600,
                                    borderRadius: 3,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: 4,
                                    },
                                  }}
                              >
                                {slotTime}
                              </Button>
                            </Zoom>
                            );
                          })}
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>
            </Fade>
          )}

          {/* Step 4: Confirmation */}
          {activeStep === 3 && (
            <Fade in timeout={300}>
              <Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                  Confirmez votre réservation
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
                  Vérifiez les détails de votre rendez-vous
                </Typography>

                <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
                  <Stack spacing={4}>
                    {/* Service */}
                    <Box>
                      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
                        SERVICE SÉLECTIONNÉ
                      </Typography>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                          <ContentCut sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {selectedService?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {selectedService?.description}
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <Chip 
                              icon={<AccessTime />} 
                              label={`${selectedService?.duration_min} minutes`} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                            <Chip 
                              icon={<Euro />}
                              label={`${selectedService?.price_dhs} DH`} 
                              size="small" 
                              color="secondary"
                              variant="outlined"
                            />
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                    
                    {/* Employee */}
                    <Box>
                      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
                        COIFFEUR
                      </Typography>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar 
                          sx={{ bgcolor: selectedEmployee ? 'primary.main' : 'grey.400', width: 60, height: 60 }}
                          src={selectedEmployee?.profile_picture}
                        >
                          <Person sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {selectedEmployee?.full_name || 'Premier disponible'}
                          </Typography>
                          {selectedEmployee?.note && (
                            <Typography variant="body2" color="text.secondary">
                              {selectedEmployee.note}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                    
                    {/* Date & Time */}
                    <Box>
                      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
                        DATE ET HEURE
                      </Typography>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 60, height: 60 }}>
                          <CalendarToday sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {bookingData.dateTime && format(bookingData.dateTime, 'EEEE dd MMMM yyyy', { locale: fr })}
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            {bookingData.dateTime && format(bookingData.dateTime, 'HH:mm')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Fade>
          )}
        </Box>

        {/* Navigation */}
        <Paper sx={{ p: 3, borderRadius: 3, mt: 4 }}>
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0 || (activeStep === 2 && !showTimeSlots)}
              startIcon={<ArrowBack />}
              size="large"
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              Retour
            </Button>

            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
              endIcon={activeStep === steps.length - 1 ? <Check /> : <ArrowForward />}
              size="large"
              sx={{ minWidth: 120, borderRadius: 2 }}
            >
              {activeStep === steps.length - 1 ? 'Confirmer' : 
               activeStep === 2 && !showTimeSlots ? 'Choisir l\'heure' : 'Suivant'}
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmationOpen} 
        onClose={() => setConfirmationOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={isMobile ? Transition : undefined}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 3 }
        }}
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <Typography sx={{ ml: 2, flex: 1, fontWeight: 600 }} variant="h6">
                Confirmer la réservation
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setConfirmationOpen(false)}
              >
                <Close />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}
        
        {!isMobile && (
          <DialogTitle>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Confirmer la réservation
            </Typography>
          </DialogTitle>
        )}
        
        <DialogContent sx={{ p: isMobile ? 3 : 3 }}>
          <Stack spacing={3}>
            <Typography variant="h6">
              Voulez-vous confirmer cette réservation ?
            </Typography>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>
                Une fois confirmée, vous pourrez annuler votre réservation jusqu'à 2 heures avant le rendez-vous.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          {!isMobile && (
            <Button 
              onClick={() => setConfirmationOpen(false)}
              variant="outlined"
              size="large"
              sx={{ borderRadius: 2 }}
            >
              Annuler
            </Button>
          )}
          <Button
            onClick={handleConfirmReservation}
            variant="contained"
            disabled={createReservationMutation.isPending}
            fullWidth={isMobile}
            size="large"
            sx={{ borderRadius: 2 }}
          >
            {createReservationMutation.isPending ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={20} />
                <Typography>Confirmation...</Typography>
              </Stack>
            ) : 'Confirmer la réservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingFlow; 