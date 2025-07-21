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
  Grid,
  FormHelperText,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import type { Reservation, Service, Employee } from '../../types';

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ManualReservationData) => void;
  isLoading?: boolean;
  reservation?: Reservation | null; // For editing
  title?: string;
}

interface ManualReservationData {
  client_full_name: string;
  client_phone: string;
  service_id: number;
  employee_id: number;
  start_at: Date;
  type: 'manual';
}

// Validation schema
const schema = yup.object({
  client_full_name: yup
    .string()
    .required('Le nom complet est obligatoire')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères'),
  client_phone: yup
    .string()
    .required('Le numéro de téléphone est obligatoire')
    .matches(
      /^(\+212|0)([ \-_/]*)(\d[ \-_/]*){8,9}$/,
      'Format de téléphone invalide (ex: +212 6 12 34 56 78 ou 06 12 34 56 78)'
    ),
  service_id: yup
    .number()
    .required('Veuillez sélectionner un service')
    .positive('Veuillez sélectionner un service'),
  employee_id: yup
    .number()
    .required('Veuillez sélectionner un employé')
    .positive('Veuillez sélectionner un employé'),
  start_at: yup
    .date()
    .required('Veuillez sélectionner une date et heure')
    .min(new Date(), 'La date ne peut pas être dans le passé'),
  type: yup.string().oneOf(['manual']).required(),
});

/**
 * ReservationForm Component
 * 
 * Form for creating manual reservations (admin creates for clients)
 * Features:
 * - Client information (name, phone)
 * - Service selection
 * - Employee selection
 * - Date/time selection
 * - Validation
 */
const ReservationForm: React.FC<ReservationFormProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  reservation = null,
  title = 'Nouvelle réservation manuelle',
}) => {
  const isEdit = Boolean(reservation);

  // Fetch services
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/services`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      return data;
    },
    enabled: open,
  });

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      return data;
    },
    enabled: open,
  });

  const services = Array.isArray(servicesData?.data?.data) ? servicesData.data.data : 
                  Array.isArray(servicesData?.data) ? servicesData.data : 
                  Array.isArray(servicesData) ? servicesData : [];

  const employees = Array.isArray(employeesData?.data?.data) ? employeesData.data.data : 
                   Array.isArray(employeesData?.data) ? employeesData.data : 
                   Array.isArray(employeesData) ? employeesData : [];

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<ManualReservationData>({
    resolver: yupResolver(schema),
    defaultValues: {
      client_full_name: '',
      client_phone: '',
      service_id: 0,
      employee_id: 0,
      start_at: new Date(),
      type: 'manual',
    },
    mode: 'onChange',
  });

  const selectedServiceId = watch('service_id');
  const selectedService = services.find((s: Service) => s.id === selectedServiceId);

  // Reset form when opening/closing or editing
  useEffect(() => {
    if (open) {
      if (isEdit && reservation) {
        reset({
          client_full_name: reservation.client_full_name || '',
          client_phone: reservation.client_phone || '',
          service_id: reservation.service_id,
          employee_id: reservation.employee_id,
          start_at: new Date(reservation.start_at),
          type: 'manual',
        });
      } else {
        reset({
          client_full_name: '',
          client_phone: '',
          service_id: 0,
          employee_id: 0,
          start_at: new Date(),
          type: 'manual',
        });
      }
    }
  }, [open, isEdit, reservation, reset]);

  const handleFormSubmit = (data: ManualReservationData) => {
    onSubmit(data);
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  const isFormLoading = servicesLoading || employeesLoading || isLoading;

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Créer une réservation au nom d'un client
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          {isFormLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" sx={{ mt: 2 }}>
              {/* Client Information */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                Informations du client
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
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
                </Grid>

                <Grid item xs={12} sm={6}>
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
                        placeholder="Ex: +212 6 12 34 56 78"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Service Selection */}
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Détails de la réservation
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
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
                          <MenuItem value={0}>
                            <em>Sélectionnez un service</em>
                          </MenuItem>
                          {services.map((service: Service) => (
                            <MenuItem key={service.id} value={service.id}>
                              {service.name} - {service.duration_min} min - {service.price_dhs} DH
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.service_id && (
                          <FormHelperText>{errors.service_id.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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
                          <MenuItem value={0}>
                            <em>Sélectionnez un employé</em>
                          </MenuItem>
                          {employees.map((employee: Employee) => (
                            <MenuItem key={employee.id} value={employee.id}>
                              {employee.full_name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.employee_id && (
                          <FormHelperText>{errors.employee_id.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="start_at"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        label="Date et heure"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        minutesStep={30}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.start_at,
                            helperText: errors.start_at?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

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
        <Button onClick={handleCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={!isValid || isLoading || isFormLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? 'Création...' : isEdit ? 'Modifier' : 'Créer la réservation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationForm; 