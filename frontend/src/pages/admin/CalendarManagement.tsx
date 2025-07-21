import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  ListItemAvatar,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday,
  Event,
  Settings,
  Download,
  Upload,
  Save,
  RestartAlt,
  Info,
  Star,
  Public,
  PersonalVideo,
  CheckCircle,
  RadioButtonUnchecked,
  Palette,
  ChevronLeft,
  ChevronRight,
  Schedule,
  Person,
  Add,
  Delete,
  Clear,
  SelectAll,
  WorkOff,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getMonth, getYear, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Holiday, HolidaySettings } from '../../types';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

// Types for day detail popup
interface DayInfo {
  date: Date;
  reservations: any[];
  employees: any[];
  holiday?: Holiday;
  isToday: boolean;
  isNonWorkingDay: boolean;
}

/**
 * CalendarManagement Component
 * 
 * A comprehensive calendar interface for managing holidays with:
 * - Interactive calendar view
 * - Holiday system toggle (Standard vs Custom)
 * - Custom holiday selection by clicking dates
 * - Holiday import/export functionality
 * - Beautiful UI with animations
 */
const CalendarManagement: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [yearMenuAnchor, setYearMenuAnchor] = useState<HTMLElement | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  
  // Day detail popup states
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);

  // Fetch holiday settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['holiday-settings'],
    queryFn: async (): Promise<HolidaySettings> => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/holidays/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      return data.data;
    },
  });

  // Fetch reservations for day details
  const { data: reservationsData, isLoading: reservationsLoading, error: reservationsError } = useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reservations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch reservations');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication required')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Ensure reservations is always an array (handle Laravel pagination)
  const reservations = Array.isArray(reservationsData?.data?.data) ? reservationsData.data.data : 
                      Array.isArray(reservationsData?.data) ? reservationsData.data : 
                      Array.isArray(reservationsData) ? reservationsData : [];



  // Fetch employees for day details
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('Authentication required')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Ensure employees is always an array (handle Laravel pagination)
  const employees = Array.isArray(employeesData?.data?.data) ? employeesData.data.data : 
                   Array.isArray(employeesData?.data) ? employeesData.data : 
                   Array.isArray(employeesData) ? employeesData : [];

  // Fetch holidays for current year and adjacent years (for cross-month selections)
  const currentYear = getYear(currentDate);
  const { data: holidays = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['holidays-multi-year', currentYear],
    queryFn: async (): Promise<Holiday[]> => {
      // Fetch holidays for current year and adjacent years
      const years = [currentYear - 1, currentYear, currentYear + 1];
      const responses = await Promise.all(
        years.map(year => 
          fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/holidays?year=${year}&active=true`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
                'Accept': 'application/json',
              },
            }
          )
        )
      );
      
      const allHolidays: Holiday[] = [];
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          allHolidays.push(...(data.data || []));
        }
      }
      return allHolidays;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<HolidaySettings>) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/holidays/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holiday-settings'] });
      showSnackbar('Paramètres mis à jour avec succès', 'success');
    },
    onError: () => {
      showSnackbar('Erreur lors de la mise à jour des paramètres', 'error');
    },
  });

  // Import Moroccan holidays mutation
  const importHolidaysMutation = useMutation({
    mutationFn: async (year: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/holidays/import-moroccan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ year }),
      });
      if (!response.ok) throw new Error('Failed to import holidays');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['holidays-multi-year'] });
      showSnackbar(`${data.data.total} jours fériés importés pour ${data.data.year}`, 'success');
    },
    onError: () => {
      showSnackbar('Erreur lors de l\'importation des jours fériés', 'error');
    },
  });

  // Save custom holidays mutation
  const saveCustomHolidaysMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      // First, delete existing custom holidays for the year
      const existingCustomHolidays = holidays.filter(h => h.type === 'custom');
      
      // Delete old custom holidays with error handling
      for (const holiday of existingCustomHolidays) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/holidays`, {
            method: 'DELETE',
            body: JSON.stringify({ type: holiday.type, month: holiday.month, day: holiday.day }),
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
          
          // Log 404s but don't fail - holiday might already be deleted
          if (!response.ok && response.status !== 404) {
            console.warn(`Failed to delete holiday: ${response.status}`);
          }
        } catch (error) {
          console.warn('Error deleting holiday:', error);
        }
      }

      // Create new custom holidays
      for (const date of dates) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/holidays`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            month: new Date(date).getMonth() + 1,
            day: new Date(date).getDate(),
            name: `Jour férié personnalisé ${format(new Date(date), 'dd/MM', { locale: fr })}`,
            type: 'custom',
            is_active: true,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays-multi-year'] });
      setIsCustomizing(false);
      setSelectedDates([]);
      showSnackbar('Jours fériés personnalisés sauvegardés', 'success');
    },
    onError: () => {
      showSnackbar('Erreur lors de la sauvegarde', 'error');
    },
  });

  // Add selected dates as holidays mutation
  const addSelectedAsHolidaysMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      // Only add dates that aren't already holidays
      const existingHolidayDates = holidays
        .filter(h => h.type === 'custom')
        .map(h => {
          try {
            const date = new Date(displayYear, h.month - 1, h.day);
            return format(date, 'yyyy-MM-dd');
          } catch {
            return null;
          }
        })
        .filter((date): date is string => date !== null);

      const newDates = dates.filter(date => !existingHolidayDates.includes(date));

      for (const date of newDates) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/holidays`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            month: new Date(date).getMonth() + 1,
            day: new Date(date).getDate(),
            name: `Jour férié personnalisé ${format(new Date(date), 'dd/MM', { locale: fr })}`,
            type: 'custom',
            is_active: true,
          }),
        });
      }
      return { added: newDates.length, skipped: dates.length - newDates.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['holidays-multi-year'] });
      setSelectedDates([]);
      showSnackbar(`${result.added} jour(s) férié(s) ajouté(s)${result.skipped > 0 ? `, ${result.skipped} ignoré(s) (déjà fériés)` : ''}`, 'success');
    },
    onError: () => {
      showSnackbar('Erreur lors de l\'ajout des jours fériés', 'error');
    },
  });

  // Remove selected dates from holidays mutation
  const removeSelectedHolidaysMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      const holidaysToRemove = holidays.filter(h => {
        if (h.type !== 'custom') return false;
        try {
          const holidayDate = new Date(displayYear, h.month - 1, h.day);
          const holidayDateStr = format(holidayDate, 'yyyy-MM-dd');
          return dates.includes(holidayDateStr);
        } catch {
          return false;
        }
      });

      let successfulDeletes = 0;
      for (const holiday of holidaysToRemove) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/holidays`, {
            method: 'DELETE',
            body: JSON.stringify({ type: holiday.type, month: holiday.month, day: holiday.day }),
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
          
          // Only count as success if status is 200 or 404 (already deleted)
          if (response.ok || response.status === 404) {
            successfulDeletes++;
          }
        } catch (error) {
          // Silently continue on network errors - the holiday might already be deleted
          console.warn('Error deleting holiday:', error);
        }
      }
      return successfulDeletes;
    },
    onSuccess: (removedCount) => {
      queryClient.invalidateQueries({ queryKey: ['holidays-multi-year'] });
      setSelectedDates([]);
      showSnackbar(`${removedCount} jour(s) férié(s) supprimé(s)`, 'success');
    },
    onError: () => {
      showSnackbar('Erreur lors de la suppression des jours fériés', 'error');
    },
  });

  // Helper functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Generate calendar days for current month (including previous/next month days for complete grid)
  const generateCalendarDays = (filteredHolidays: Holiday[]): CalendarDay[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start from Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return days.map(date => ({
      date,
      isCurrentMonth: getMonth(date) === getMonth(currentDate),
      isToday: isToday(date),
      isSelected: selectedDates.includes(format(date, 'yyyy-MM-dd')),
      isHoliday: filteredHolidays.some(h => h.month === getMonth(date) + 1 && h.day === date.getDate()),
      holidayName: filteredHolidays.find(h => h.month === getMonth(date) + 1 && h.day === date.getDate())?.name,
    }));
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
    // Keep selections when changing months for cross-month holiday selection
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
    // Keep selections when changing months for cross-month holiday selection
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    // Keep selections when changing months for cross-month holiday selection
  };

  const handleYearMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setYearMenuAnchor(event.currentTarget);
  };

  const handleYearMenuClose = () => {
    setYearMenuAnchor(null);
  };

  const goToYear = (year: number) => {
    setCurrentDate(prev => new Date(year, getMonth(prev), 1));
    // Keep selections when changing years for cross-month holiday selection
    handleYearMenuClose();
  };

  // Day detail helper functions
  const getReservationsForDate = (date: Date | null) => {
    if (!date || !Array.isArray(reservations)) return [];
    try {
      return reservations.filter((r: any) => {
        if (!r.start_at) return false;
        return isSameDay(new Date(r.start_at), date);
      });
    } catch (error) {
      console.error('Error filtering reservations:', error);
      return [];
    }
  };

  const getEmployeesForDate = (date: Date | null) => {
    if (!date || !Array.isArray(employees)) return [];
    return employees; // For now, return all employees
  };

  const getHolidayForDate = (date: Date | null): Holiday | undefined => {
    if (!date) return undefined;
    return filteredHolidays.find(h => h.month === getMonth(date) + 1 && h.day === date.getDate());
  };

  const createDayInfo = (date: Date | null): DayInfo | null => {
    if (!date) return null;
    
    const dayReservations = getReservationsForDate(date);
    const dayEmployees = getEmployeesForDate(date);
    const holiday = getHolidayForDate(date);
    
    return {
      date,
      reservations: dayReservations,
      employees: dayEmployees,
      holiday,
      isToday: isToday(date),
      isNonWorkingDay: false, // For now, assume all days are working days
    };
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

  // Handle date click for custom holiday selection or day detail popup
  const handleDateClick = (date: Date) => {
    if (isCustomizing) {
      // Custom holiday selection mode
      const dateStr = format(date, 'yyyy-MM-dd');
      setSelectedDates(prev => 
        prev.includes(dateStr) 
          ? prev.filter(d => d !== dateStr)
          : [...prev, dateStr]
      );
    } else {
      // Normal mode - show day details
      const dayInfo = createDayInfo(date);
      setSelectedDay(dayInfo);
      setDayDetailOpen(true);
    }
  };

  // Handle holiday system toggle
  const handleSystemToggle = (useStandard: boolean) => {
    updateSettingsMutation.mutate({
      holiday_system_type: useStandard ? 'standard' : 'custom',
    });
  };

  // Start customizing holidays
  const startCustomizing = () => {
    setIsCustomizing(true);
    // Initialize with existing custom holidays for current year
    const customHolidays = holidays
      .filter(h => h.type === 'custom')
      .map(h => {
        try {
          const date = new Date(displayYear, h.month - 1, h.day);
          return format(date, 'yyyy-MM-dd');
        } catch {
          return null;
        }
      })
      .filter((date): date is string => date !== null);
    setSelectedDates(customHolidays);
  };

  // Cancel customization
  const cancelCustomizing = () => {
    setIsCustomizing(false);
    setSelectedDates([]);
  };

  // Save custom holidays
  const saveCustomHolidays = () => {
    saveCustomHolidaysMutation.mutate(selectedDates);
  };

  // Enhanced bulk selection operations
  const clearSelection = () => {
    setSelectedDates([]);
  };

  const selectAllHolidays = () => {
    const currentYearHolidays = holidays
      .filter(h => h.type === 'custom')
      .map(h => {
        try {
          const date = new Date(displayYear, h.month - 1, h.day);
          return format(date, 'yyyy-MM-dd');
        } catch {
          return null;
        }
      })
      .filter((date): date is string => date !== null);
    setSelectedDates(currentYearHolidays);
  };

  const selectAllWorkingDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const workingDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
      .filter(date => {
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
      })
      .map(date => format(date, 'yyyy-MM-dd'));
    setSelectedDates(workingDays);
  };

  const displayYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate);

  // Show loading state
  const isLoading = settingsLoading || holidaysLoading || reservationsLoading || employeesLoading;

  // Filter holidays based on current system type
  const getFilteredHolidays = () => {
    if (!holidays || holidays.length === 0) return [];
    
    return holidays.filter(holiday => {
      if (settings?.holiday_system_type === 'standard') {
        return holiday.type === 'standard';
      } else if (settings?.holiday_system_type === 'custom') {
        return holiday.type === 'custom';
      }
      return true; // Show all if no setting
    });
  };

  const filteredHolidays = getFilteredHolidays();
  const calendarDays = generateCalendarDays(filteredHolidays);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarToday sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Mes Calendriers
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Informations">
              <IconButton onClick={() => setShowInfoDialog(true)}>
                <Info />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Gérez vos jours fériés et personnalisez votre calendrier de réservations
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
        gap: 3 
      }}>
        {/* Main Calendar Area */}
        <Box>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            }}
          >
            {/* Loading indicator */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Chargement des données...
                </Typography>
              </Box>
            )}

            {/* Error indicators */}
            {(reservationsError || employeesError) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {reservationsError && 'Impossible de charger les réservations. '}
                  {employeesError && 'Impossible de charger les employés. '}
                  Les détails des jours pourraient être limités.
                </Typography>
              </Alert>
            )}

            {/* Calendar Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={goToPreviousMonth} size="small">
                    <ChevronLeft />
                  </IconButton>
                  
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main', minWidth: 200, textAlign: 'center' }}>
                    {format(currentDate, 'MMMM', { locale: fr })}
                    {' '}
                    <Button
                      variant="text"
                      onClick={handleYearMenuOpen}
                      sx={{ 
                        fontSize: 'inherit', 
                        fontWeight: 'inherit', 
                        color: 'inherit',
                        minWidth: 'auto',
                        p: 0,
                        '&:hover': {
                          bgcolor: 'transparent',
                          textDecoration: 'underline',
                        }
                      }}
                    >
                      {getYear(currentDate)}
                    </Button>
                  </Typography>
                  
                  <IconButton onClick={goToNextMonth} size="small">
                    <ChevronRight />
                  </IconButton>
                </Box>
                
                {isCustomizing && (
                  <Chip
                    icon={<Palette />}
                    label="Mode personnalisation"
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={goToToday}
                sx={{ fontSize: '0.875rem' }}
              >
                Aujourd'hui
              </Button>
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 1,
              mb: 2 
            }}>
              {/* Day headers */}
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <Box
                  key={day}
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                  }}
                >
                  {day}
                </Box>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const dayReservations = getReservationsForDate(day.date);
                const reservationCount = dayReservations.length;
                const hasReservations = reservationCount > 0;
                
                // Create tooltip content
                const tooltipTitle = isCustomizing 
                  ? `${format(day.date, 'dd MMMM yyyy', { locale: fr })}${day.isHoliday ? ` - ${day.holidayName}` : ''}` 
                  : hasReservations 
                    ? `${format(day.date, 'dd MMMM yyyy', { locale: fr })} - ${reservationCount} réservation${reservationCount > 1 ? 's' : ''}${day.isHoliday ? ` - ${day.holidayName}` : ''}`
                    : `${format(day.date, 'dd MMMM yyyy', { locale: fr })}${day.isHoliday ? ` - ${day.holidayName}` : ''}`;

                return (
                  <Tooltip
                    key={index}
                    title={tooltipTitle}
                    placement="top"
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          fontSize: '0.75rem',
                          maxWidth: 250,
                        },
                      },
                    }}
                  >
                    <Box
                      onClick={() => handleDateClick(day.date)}
                      sx={{
                        position: 'relative',
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 2,
                        cursor: 'pointer', // Always clickable for both customizing and day details
                        fontSize: '0.9rem',
                        fontWeight: day.isToday ? 600 : 400,
                        color: day.isToday 
                          ? 'primary.contrastText' 
                          : day.isHoliday
                            ? 'error.main'
                            : !day.isCurrentMonth 
                              ? 'text.disabled'
                              : 'text.primary',
                        bgcolor: day.isToday 
                          ? 'primary.main'
                          : day.isSelected 
                            ? alpha(theme.palette.secondary.main, 0.2)
                            : day.isHoliday
                              ? alpha(theme.palette.error.main, day.isCurrentMonth ? 0.1 : 0.05)
                              : hasReservations && day.isCurrentMonth
                                ? alpha(theme.palette.info.main, 0.08)
                                : 'transparent',
                        border: day.isSelected ? `2px solid ${theme.palette.secondary.main}` : 'none',
                        opacity: day.isCurrentMonth ? 1 : 0.6,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: isCustomizing 
                            ? alpha(theme.palette.secondary.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.1),
                          transform: 'scale(1.05)',
                        },
                      }}
                    >
                      {format(day.date, 'd')}
                      
                      {/* Holiday indicator */}
                      {day.isHoliday && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                          }}
                        />
                      )}
                      
                      {/* Reservation count indicator */}
                      {hasReservations && day.isCurrentMonth && !isCustomizing && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            minWidth: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: 'info.main',
                            color: 'info.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                          }}
                        >
                          {reservationCount}
                        </Box>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>

            {/* Calendar Legend */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="caption">Aujourd'hui</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: alpha(theme.palette.error.main, 0.6) }} />
                <Typography variant="caption">Jour férié</Typography>
              </Box>
              {isCustomizing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: alpha(theme.palette.secondary.main, 0.6) }} />
                  <Typography variant="caption">Sélectionné</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Right Sidebar - Holiday Management */}
        <Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Holiday System Toggle */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Settings color="primary" />
                  Système de jours fériés
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.holiday_system_type === 'standard'}
                        onChange={(e) => handleSystemToggle(e.target.checked)}
                        disabled={updateSettingsMutation.isPending}
                      />
                    }
                    label={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Public fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            Jours fériés marocains
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Utilise automatiquement les jours fériés officiels du Maroc
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.holiday_system_type === 'custom'}
                        onChange={(e) => handleSystemToggle(!e.target.checked)}
                        disabled={updateSettingsMutation.isPending}
                      />
                    }
                    label={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonalVideo fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            Jours fériés personnalisés
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Définissez vos propres jours fériés
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Custom Holiday Management */}
            {settings?.holiday_system_type === 'custom' && (
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event color="secondary" />
                    Jours fériés personnalisés
                  </Typography>
                  
                  {!isCustomizing ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {filteredHolidays.length} jour(s) férié(s) pour {displayYear}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={startCustomizing}
                        startIcon={<Palette />}
                        fullWidth
                      >
                        Personnaliser les jours fériés
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Sélectionnez des jours en cliquant sur le calendrier ({selectedDates.length} sélectionné{selectedDates.length > 1 ? 's' : ''})
                      </Typography>
                      
                      {/* Simple Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => addSelectedAsHolidaysMutation.mutate(selectedDates)}
                          startIcon={<Add />}
                          disabled={selectedDates.length === 0 || addSelectedAsHolidaysMutation.isPending}
                          size="small"
                        >
                          Ajouter fériés
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => removeSelectedHolidaysMutation.mutate(selectedDates)}
                          startIcon={<Delete />}
                          disabled={selectedDates.length === 0 || removeSelectedHolidaysMutation.isPending}
                          size="small"
                        >
                          Supprimer
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={clearSelection}
                          startIcon={<Clear />}
                          disabled={selectedDates.length === 0}
                          size="small"
                        >
                          Effacer
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={cancelCustomizing}
                          size="small"
                        >
                          Annuler
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Import Actions */}
            {settings?.holiday_system_type === 'standard' && (
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Download color="info" />
                    Actions
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    onClick={() => importHolidaysMutation.mutate(displayYear)}
                    startIcon={<Download />}
                    disabled={importHolidaysMutation.isPending}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                                          Importer jours fériés {displayYear}
                  </Button>
                  
                  <Typography variant="caption" color="text.secondary">
                    Met à jour les jours fériés marocains pour l'année courante
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Holiday List */}
            {holidays.length > 0 && (
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star color="warning" />
                    Jours fériés {displayYear}
                  </Typography>
                  
                  <List dense>
                    {filteredHolidays
                      .slice(0, 5)
                      .map((holiday, index) => (
                        <ListItem key={`${holiday.type}-${holiday.month}-${holiday.day}-${index}`} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckCircle 
                              fontSize="small" 
                              color={holiday.type === 'custom' ? 'secondary' : 'primary'} 
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={holiday.name}
                            secondary={`${String(holiday.day).padStart(2, '0')}/${String(holiday.month).padStart(2, '0')}`}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItem>
                      ))}
                    
                    {filteredHolidays.length > 5 && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText>
                          <Typography variant="caption" color="text.secondary">
                            ... et {filteredHolidays.length - 5} autre(s)
                          </Typography>
                        </ListItemText>
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Box>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onClose={() => setShowInfoDialog(false)} maxWidth="md">
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="primary" />
            Aide - Gestion des calendriers
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Cette page vous permet de gérer les jours fériés de votre salon :
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon><Public /></ListItemIcon>
              <ListItemText 
                primary="Jours fériés marocains"
                secondary="Utilise automatiquement les jours fériés officiels du Maroc"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><PersonalVideo /></ListItemIcon>
              <ListItemText 
                primary="Jours fériés personnalisés"
                secondary="Définissez vos propres jours de fermeture"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Palette /></ListItemIcon>
              <ListItemText 
                primary="Mode personnalisation"
                secondary="Cliquez sur les dates du calendrier pour les marquer comme jours fériés"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInfoDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Year Selection Menu */}
      <Menu
        anchorEl={yearMenuAnchor}
        open={Boolean(yearMenuAnchor)}
        onClose={handleYearMenuClose}
        PaperProps={{
          sx: { maxHeight: 300 }
        }}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const year = new Date().getFullYear() - 3 + i;
          return (
            <MenuItem 
              key={year} 
              onClick={() => goToYear(year)}
              selected={year === getYear(currentDate)}
            >
              {year}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

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
                    label={selectedDay.holiday.type === 'standard' ? 'Jour férié officiel' : 'Jour férié personnalisé'}
                    color={selectedDay.holiday.type === 'standard' ? 'primary' : 'secondary'}
                    size="small"
                  />
                )}
              </Box>
            </DialogTitle>
            
            <DialogContent>
              {/* Holiday info */}
              {selectedDay.holiday && (
                <Alert 
                  severity="info" 
                  icon={selectedDay.holiday.type === 'standard' ? '🇲🇦' : '🎉'}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    {selectedDay.holiday.name}
                  </Typography>
                </Alert>
              )}

              {/* Show holiday message and stop here if it's a holiday */}
              {selectedDay.holiday ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Ceci est un jour férié. Aucune activité commerciale n'est prévue.
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
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {reservation.type === 'manual' && reservation.client_full_name 
                                    ? reservation.client_full_name 
                                    : reservation.client?.full_name || 'Client'}
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
                        {selectedDay.employees.map((employee: any) => (
                          <Chip
                            key={employee.id}
                            label={employee.full_name}
                            variant="outlined"
                            size="small"
                            avatar={<Avatar sx={{ width: 24, height: 24 }}>{employee.full_name?.charAt(0)}</Avatar>}
                          />
                        ))}
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
    </Container>
  );
};

export default CalendarManagement; 