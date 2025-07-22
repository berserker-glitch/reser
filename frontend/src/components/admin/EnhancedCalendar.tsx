import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Event,
  Person,
  Schedule,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAllHolidays, type Holiday } from '../../services/holidayService';
import { getAllWorkingHours, isWorkingDay, getEmployeesWorkingOnDay } from '../../services/workingHoursService';
import { useSalonId } from '../../hooks/useSalonContext';

// Types
interface DayInfo {
  date: Date;
  reservations: any[];
  employees: any[];
  holiday?: Holiday;
  isToday: boolean;
  isNonWorkingDay: boolean; // Changed from isWeekend to isNonWorkingDay
}

interface EnhancedCalendarProps {
  reservations?: any[];
  employees?: any[];
  onDateClick?: (date: Date) => void;
  compact?: boolean;
}

/**
 * EnhancedCalendar Component
 * 
 * Advanced calendar with:
 * - Moroccan national and Islamic holidays
 * - Day detail popup with reservations and employee info
 * - Holiday indicators and tooltips
 * - Reservation count indicators
 * - Weekend and today highlighting
 */
const EnhancedCalendar: React.FC<EnhancedCalendarProps> = ({
  reservations = [],
  employees = [],
  onDateClick,
  compact = false
}) => {
  const theme = useTheme(); // Add theme hook for holiday styling
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const salonId = useSalonId();

  // Fetch holidays for current year
  const { 
    data: holidays = [], 
    isLoading: holidaysLoading,
    error: holidaysError 
  } = useQuery({
    queryKey: ['holidays', salonId, currentDate.getFullYear()],
    queryFn: async () => {
      console.log('🔍 EnhancedCalendar: Fetching holidays for', { salonId, year: currentDate.getFullYear() });
      const result = await getAllHolidays(salonId, currentDate.getFullYear());
      console.log('📅 EnhancedCalendar: Holidays received:', result);
      return result;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (previously cacheTime)
  });

  // Fetch working hours for all employees
  const { 
    data: workingHours = [], 
    isLoading: workingHoursLoading,
    error: workingHoursError
  } = useQuery({
    queryKey: ['working-hours'],
    queryFn: getAllWorkingHours,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2, // Retry failed requests
  });

  // Generate calendar days with proper alignment
  const calendarGrid = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start, end });
    
    // Get the day of week for the first day of the month
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We need to convert this to our Monday-first system
    const firstDayOfWeek = start.getDay();
    const mondayFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert Sunday (0) to 6, others subtract 1
    
    // Create empty cells for days before the month starts
    const emptyCells = Array(mondayFirstDay).fill(null);
    
    // Combine empty cells with actual days
    return [...emptyCells, ...monthDays];
  }, [currentDate]);

  // Get reservations for a specific date
  const getReservationsForDate = (date: Date | null) => {
    if (!date) return [];
    
    return reservations.filter((r: any) => {
      return isSameDay(new Date(r.start_at), date);
    });
  };

  // Get employees expected to work on a specific date
  const getEmployeesForDate = (date: Date | null) => {
    if (!date) return [];
    
    // If working hours failed to load, return all employees as a fallback
    if (workingHoursError || !workingHours || workingHours.length === 0) {
      return employees;
    }
    
    const weekday = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Filter employees based on their working hours for this weekday
    return employees.filter((employee: any) => {
      // Find this employee's working hours group
      const employeeWorkingHours = workingHours.find(group => 
        group.employee.id === employee.id
      );
      
      if (!employeeWorkingHours) return false;
      
      // Check if this employee works on this weekday
      const daySchedule = employeeWorkingHours.schedule.find(schedule => 
        schedule.weekday === weekday && 
        schedule.start_time !== null && 
        schedule.end_time !== null
      );
      
      return !!daySchedule;
    });
  };

  // Get holiday for a specific date
  const getHolidayForDate = (date: Date | null): Holiday | undefined => {
    if (!date) return undefined;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const foundHoliday = (holidays as Holiday[]).find(h => {
      // Handle both date formats: "2025-01-01" and "2025-01-01T00:00:00.000000Z"
      const holidayDateStr = h.id.includes('T') ? h.id.split('T')[0] : h.id;
      return holidayDateStr === dateStr;
    });
    
    // Debug logging for January 1st specifically
    if (dateStr === '2025-01-01') {
      console.log('🔍 Checking holiday for Jan 1st:', {
        dateStr,
        availableHolidays: holidays,
        foundHoliday,
        holidaysArray: (holidays as Holiday[]).map(h => ({ 
          id: h.id, 
          name: h.name, 
          parsedDate: h.id.includes('T') ? h.id.split('T')[0] : h.id 
        }))
      });
    }
    
    return foundHoliday;
  };

  // Create day info object
  const createDayInfo = (date: Date | null): DayInfo | null => {
    if (!date) return null;
    
    const dayReservations = getReservationsForDate(date);
    const dayEmployees = getEmployeesForDate(date);
    const holiday = getHolidayForDate(date);
    
    // Check if this is a non-working day based on actual working hours
    const weekday = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // If working hours failed to load, use traditional weekend logic as fallback
    let isWorkingDayForSalon = true;
    if (workingHoursError || !workingHours || workingHours.length === 0) {
      // Fallback: Assume traditional weekend (Sunday/Saturday are non-working)
      isWorkingDayForSalon = weekday !== 0 && weekday !== 6;
    } else {
      isWorkingDayForSalon = isWorkingDay(weekday, workingHours);
    }
    
    return {
      date,
      reservations: dayReservations,
      employees: dayEmployees,
      holiday,
      isToday: isToday(date),
      isNonWorkingDay: !isWorkingDayForSalon, // True if no employees work on this day
    };
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    const dayInfo = createDayInfo(date);
    setSelectedDay(dayInfo);
    setDayDetailOpen(true);
    
    if (onDateClick) {
      onDateClick(date);
    }
  };

  // Navigation handlers
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Get status color for reservation
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'REQUESTED': return 'warning';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  if (holidaysLoading || workingHoursLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Chargement du calendrier...
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper sx={{ p: compact ? 2 : 3 }}>
        <Typography variant={compact ? "subtitle1" : "h6"} sx={{ mb: 2, fontWeight: 700 }}>
          Calendrier {!compact && "Avancé"}
        </Typography>

        {/* Calendar Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <IconButton size="small" onClick={handlePrevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant={compact ? "body1" : "subtitle1"} sx={{ fontWeight: 600 }}>
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </Typography>
          <IconButton size="small" onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Error Warnings */}
        {holidaysError && (
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.75rem' }}>
            Impossible de charger les jours fériés
          </Alert>
        )}
        {workingHoursError && (
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
            Horaires de travail non disponibles - affichage par défaut
          </Alert>
        )}

        {/* Calendar Grid */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: 0.5,
          mb: 2,
        }}>
          {/* Day headers */}
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
            <Box
              key={`day-${index}`}
              sx={{
                width: compact ? 28 : 32,
                height: compact ? 20 : 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {day}
            </Box>
          ))}
          
          {/* Calendar days */}
          {calendarGrid.map((day, index) => {
            // Handle empty cells
            if (day === null) {
              return (
                <Box
                  key={`empty-${index}`}
                  sx={{
                    width: compact ? 28 : 32,
                    height: compact ? 28 : 32,
                  }}
                />
              );
            }

            const dayInfo = createDayInfo(day);
            if (!dayInfo) {
              return (
                <Box
                  key={`invalid-${index}`}
                  sx={{
                    width: compact ? 28 : 32,
                    height: compact ? 28 : 32,
                  }}
                />
              );
            }
            
            const hasReservations = dayInfo.reservations.length > 0;
            const isHoliday = !!dayInfo.holiday;
            
            return (
              <Tooltip
                key={`day-${index}`}
                title={
                  <Box>
                    <Typography variant="subtitle2">
                      {format(day, 'EEEE dd MMMM yyyy', { locale: fr })}
                    </Typography>
                    {isHoliday && (
                      <Typography variant="caption" color="warning.main">
                        🎉 {dayInfo.holiday!.name}
                      </Typography>
                    )}
                    {hasReservations ? (
                      <Typography variant="caption">
                        📅 {dayInfo.reservations.length} rendez-vous
                      </Typography>
                    ) : (
                      <Typography variant="caption">
                        Aucun rendez-vous
                      </Typography>
                    )}
                  </Box>
                }
              >
                <Box
                  sx={{
                    width: compact ? 28 : 32,
                    height: compact ? 28 : 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    bgcolor: dayInfo.isToday
                        ? 'primary.main'
                        : isHoliday
                          ? alpha(theme.palette.error.main, 0.1) // Holiday background in light red
                          : 'transparent',
                    color: dayInfo.isToday
                          ? 'primary.contrastText' 
                          : isHoliday
                            ? 'error.main' // Holiday text in red
                            : 'text.primary',
                    borderRadius: dayInfo.isToday ? '50%' : isHoliday ? 1 : 0,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: dayInfo.isToday
                        ? 'primary.main'
                        : isHoliday
                          ? alpha(theme.palette.error.main, 0.1) // Holiday background in light red
                          : 'transparent',
                      transform: 'scale(1.1)',
                    },
                  }}
                  onClick={() => handleDayClick(day)}
                >
                  {format(day, 'd')}
                  
                  {/* Reservation indicator */}
                  {hasReservations && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: dayInfo.reservations.some((r: any) => r.status === 'CONFIRMED') 
                          ? 'success.main' 
                          : 'warning.main',
                      }}
                    />
                  )}
                  
                  {/* Holiday indicator */}
                  {isHoliday && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 1,
                        right: 1,
                        fontSize: '8px',
                      }}
                    >
                      {dayInfo.holiday!.type === 'islamic' ? '☪️' : '🇲🇦'}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Legend */}
        {!compact && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <Chip size="small" label="🇲🇦 Fête nationale" variant="outlined" />
            <Chip size="small" label="☪️ Fête islamique" variant="outlined" />
            <Chip size="small" label="📅 Rendez-vous" color="success" variant="outlined" />
          </Box>
        )}
      </Paper>

      {/* Day Detail Dialog */}
      <Dialog 
        open={dayDetailOpen} 
        onClose={() => setDayDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedDay && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Event color="primary" />
                <Typography variant="h6">
                  {format(selectedDay.date, 'EEEE dd MMMM yyyy', { locale: fr })}
                </Typography>
                {selectedDay.holiday && (
                  <Chip 
                    label={selectedDay.holiday.type === 'islamic' ? 'Fête islamique' : 'Fête nationale'}
                    color={selectedDay.holiday.type === 'islamic' ? 'secondary' : 'primary'}
                    size="small"
                  />
                )}
              </Box>
            </DialogTitle>
            
            <DialogContent>
              {/* Holiday Information */}
              {selectedDay.holiday && (
                <Alert 
                  severity="info" 
                  icon={selectedDay.holiday.type === 'islamic' ? '☪️' : '🇲🇦'}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    {selectedDay.holiday.name}
                  </Typography>
                  {selectedDay.holiday.description && (
                    <Typography variant="caption">
                      {selectedDay.holiday.description}
                    </Typography>
                  )}
                </Alert>
              )}

              {/* Show holiday message and stop here if it's a holiday */}
              {selectedDay.holiday ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Ceci est un jour férié. Aucune activité n'est prévue.
                  </Typography>
                </Alert>
              ) : (
                <>
                  {/* Normal day content - Reservations and Employees */}

              {/* Reservations Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule color="primary" />
                  Rendez-vous ({selectedDay.reservations.length})
                </Typography>
                
                {selectedDay.reservations.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aucun rendez-vous prévu pour cette journée
                  </Typography>
                ) : (
                  <List dense>
                    {selectedDay.reservations.map((reservation: any, index: number) => (
                      <React.Fragment key={reservation.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                              {reservation.client?.full_name?.charAt(0) || 'C'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {reservation.client?.full_name || 'Client'}
                                </Typography>
                                <Chip
                                  label={reservation.status === 'CONFIRMED' ? 'Confirmé' : 
                                         reservation.status === 'REQUESTED' ? 'Demandé' :
                                         reservation.status === 'CANCELLED' ? 'Annulé' : 'Terminé'}
                                  color={getStatusColor(reservation.status) as any}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption">
                                {format(new Date(reservation.start_at), 'HH:mm')} - {format(new Date(reservation.end_at), 'HH:mm')} | 
                                {reservation.service?.name} | {reservation.employee?.full_name}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < selectedDay.reservations.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>

              {/* Employees Section */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  Employés disponibles ({selectedDay.employees.length})
                </Typography>
                
                {selectedDay.employees.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aucun employé disponible ce jour
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {workingHoursError || !workingHours || workingHours.length === 0 ? (
                      // Fallback: Show all employees if working hours data is not available
                      selectedDay.employees.map((employee: any) => (
                        <Chip
                          key={employee.id}
                          label={employee.full_name}
                          variant="outlined"
                          size="small"
                          avatar={<Avatar sx={{ width: 24, height: 24 }}>{employee.full_name?.charAt(0)}</Avatar>}
                        />
                      ))
                    ) : (
                      // Show employees with working hours if data is available
                      getEmployeesWorkingOnDay(selectedDay.date.getDay(), workingHours).map((workingEmployee: any) => (
                        <Tooltip 
                          key={workingEmployee.employee.id}
                          title={`${workingEmployee.schedule.start_time} - ${workingEmployee.schedule.end_time}`}
                        >
                          <Chip
                            label={workingEmployee.employee.full_name}
                            variant="outlined"
                            size="small"
                            avatar={<Avatar sx={{ width: 24, height: 24 }}>{workingEmployee.employee.full_name?.charAt(0)}</Avatar>}
                          />
                        </Tooltip>
                      ))
                    )}
                  </Box>
                )}
              </Box>
                </>
              )}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setDayDetailOpen(false)}>
                Fermer
              </Button>
              {selectedDay.reservations.length > 0 && (
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    // TODO: Navigate to reservations page with date filter
                    console.log('Navigate to reservations for date:', selectedDay.date);
                  }}
                >
                  Voir tous les rendez-vous
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default EnhancedCalendar; 
