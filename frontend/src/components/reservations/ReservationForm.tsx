import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, parseISO, addDays } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
// API utility for this component
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const makeApiCall = async (endpoint: string, params?: Record<string, any>) => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token');
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ManualReservationData) => void;
  isLoading?: boolean;
  reservation?: any | null; // For editing
  title?: string;
}

interface ManualReservationData {
  client_full_name: string;
  client_phone: string;
  service_id: number;
  employee_id: number;
  start_at: Date;
  notes?: string;
}

interface FormData {
  client_full_name: string;
  client_phone: string;
  service_id: number;
  employee_id: number;
  selected_date: Date;
  selected_time_slot: string;
  notes: string;
}

interface Service {
  id: number;
  name: string;
  duration_min: number;
  price_dhs: number;
  description?: string;
}

interface Employee {
  id: number;
  full_name: string;
}

interface TimeSlot {
  start_at: string;
  end_at: string;
  available: boolean;
}

// Validation schema for internal form
const formSchema = yup.object({
  client_full_name: yup.string().required('Le nom complet est requis').min(2, 'Minimum 2 caractères'),
  client_phone: yup.string().required('Le numéro de téléphone est requis'),
  service_id: yup.number().required('Veuillez sélectionner un service'),
  employee_id: yup.number().required('Veuillez sélectionner un employé'),
  selected_date: yup.date().nullable().required('Veuillez sélectionner une date'),
  selected_time_slot: yup.string().required('Veuillez sélectionner un créneau horaire'),
  notes: yup.string().default(''),
});

const ReservationForm: React.FC<ReservationFormProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  reservation = null,
  title = 'Nouvelle réservation manuelle'
}) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(formSchema),
    defaultValues: {
      client_full_name: '',
      client_phone: '',
      service_id: 0,
      employee_id: 0,
      selected_date: null,
      selected_time_slot: '',
      notes: '',
    }
  });

  // Watch for changes to trigger slot fetching
  const selectedServiceId = watch('service_id');
  const selectedEmployeeId = watch('employee_id');
  const selectedDate = watch('selected_date');

  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const response = await makeApiCall('/admin/services');
      return response.data || [];
    }
  });

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['admin-employees'],
    queryFn: async () => {
      const response = await makeApiCall('/admin/employees');
      return response.data || [];
    }
  });

  // Fetch available time slots when service, employee, or date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedServiceId || !selectedEmployeeId || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const response = await makeApiCall('/availability', {
          service_id: selectedServiceId,
          employee_id: selectedEmployeeId,
          date: dateStr
        });

        if (response.data.success) {
          setAvailableSlots(response.data.data.slots || []);
        } else {
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedServiceId, selectedEmployeeId, selectedDate]);

  // Reset time slot when dependencies change
  useEffect(() => {
    setValue('selected_time_slot', '');
  }, [selectedServiceId, selectedEmployeeId, selectedDate, setValue]);

  // Initialize form when editing
  useEffect(() => {
    if (reservation && open) {
      reset({
        client_full_name: reservation.client_full_name || '',
        client_phone: reservation.client_phone || '',
        service_id: reservation.service_id || 0,
        employee_id: reservation.employee_id || 0,
        selected_date: reservation.start_at ? parseISO(reservation.start_at) : null,
        selected_time_slot: reservation.start_at ? reservation.start_at : '',
        notes: reservation.notes || '',
      });
    } else if (open) {
      reset({
        client_full_name: '',
        client_phone: '',
        service_id: 0,
        employee_id: 0,
        selected_date: addDays(new Date(), 1), // Default to tomorrow
        selected_time_slot: '',
        notes: '',
      });
    }
  }, [reservation, open, reset]);

  // Handle form submission
  const handleFormSubmit = (data: FormData) => {
    if (!data.selected_time_slot || !data.selected_date) {
      return;
    }

    // Convert form data to ManualReservationData
    const reservationData: ManualReservationData = {
      client_full_name: data.client_full_name,
      client_phone: data.client_phone,
      service_id: data.service_id,
      employee_id: data.employee_id,
      start_at: parseISO(data.selected_time_slot),
      notes: data.notes || undefined,
    };

    onSubmit(reservationData);
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          {servicesLoading || employeesLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" sx={{ mt: 2 }}>
              {/* Client Information */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                Informations du client
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Controller
                  name="client_full_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nom complet du client"
                      fullWidth
                      error={!!errors.client_full_name}
                      helperText={errors.client_full_name?.message}
                      disabled={isLoading}
                      placeholder="Ex: Mohammed Alami"
                    />
                  )}
                />

                <Controller
                  name="client_phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Numéro de téléphone"
                      fullWidth
                      error={!!errors.client_phone}
                      helperText={errors.client_phone?.message}
                      disabled={isLoading}
                      placeholder="Ex: 0612345678"
                    />
                  )}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Service Selection */}
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Détails de la réservation
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Controller
                  name="service_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.service_id}>
                      <InputLabel>Service</InputLabel>
                      <Select
                        {...field}
                        label="Service"
                        disabled={isLoading}
                      >
                        <MenuItem value={0}>Sélectionner un service</MenuItem>
                        {services.map((service) => (
                          <MenuItem key={service.id} value={service.id}>
                            {service.name} ({service.duration_min} min - {service.price_dhs} DH)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="employee_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.employee_id}>
                      <InputLabel>Employé</InputLabel>
                      <Select
                        {...field}
                        label="Employé"
                        disabled={isLoading}
                      >
                        <MenuItem value={0}>Sélectionner un employé</MenuItem>
                        {employees.map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>

              {/* Date and Time Selection */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Controller
                  name="selected_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Date"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                      minDate={new Date()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.selected_date,
                          helperText: errors.selected_date?.message,
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  name="selected_time_slot"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.selected_time_slot}>
                      <InputLabel>Créneau horaire</InputLabel>
                      <Select
                        {...field}
                        label="Créneau horaire"
                        disabled={isLoading || loadingSlots || !selectedServiceId || !selectedEmployeeId || !selectedDate}
                      >
                        <MenuItem value="">
                          {loadingSlots ? 'Chargement...' : 'Sélectionner un créneau'}
                        </MenuItem>
                        {availableSlots.filter(slot => slot.available).map((slot) => (
                          <MenuItem key={slot.start_at} value={slot.start_at}>
                            {format(parseISO(slot.start_at), 'HH:mm')} - {format(parseISO(slot.end_at), 'HH:mm')}
                          </MenuItem>
                        ))}
                      </Select>
                      {availableSlots.length === 0 && selectedDate && selectedServiceId && selectedEmployeeId && !loadingSlots && (
                        <Typography variant="caption" color="warning.main" sx={{ mt: 1 }}>
                          Aucun créneau disponible pour cette date
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Box>

              {/* Notes */}
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes (optionnel)"
                    fullWidth
                    multiline
                    rows={3}
                    disabled={isLoading}
                    placeholder="Remarques particulières..."
                    sx={{ mb: 2 }}
                  />
                )}
              />

              {/* Service Information */}
              {selectedService && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{selectedService.name}</strong><br />
                    Durée: {selectedService.duration_min} minutes<br />
                    Prix: {selectedService.price_dhs} DH<br />
                    {selectedService.description && (
                      <>Description: {selectedService.description}</>
                    )}
                  </Typography>
                </Alert>
              )}

              {Object.keys(errors).length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Veuillez corriger les erreurs dans le formulaire
                </Alert>
              )}
            </Box>
          )}
        </LocalizationProvider>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={isLoading || loadingSlots}
        >
          {isLoading ? 'Enregistrement...' : (reservation ? 'Modifier' : 'Créer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationForm; 
