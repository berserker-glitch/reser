import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Divider,
  Alert,
  Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { Reservation, ReservationFormData, Service, Employee } from '../../types';
import { format } from 'date-fns';

interface ReservationDialogProps {
  open: boolean;
  onClose: () => void;
  reservation?: Reservation;
  onSubmit: (data: ReservationFormData) => void;
  loading?: boolean;
  error?: string;
  availableServices?: Service[];
  availableEmployees?: Employee[];
}

const validationSchema = yup.object().shape({
  service_id: yup.number().required('Service requis'),
  employee_id: yup.number().required('Employé requis'),
  start_at: yup.string().required('Date et heure requises'),
  status: yup.string().required('Statut requis'),
  type: yup.string().required('Type requis'),
  client_full_name: yup.string().when('type', {
    is: 'manual',
    then: (schema) => schema.required('Nom du client requis pour réservation manuelle'),
    otherwise: (schema) => schema.notRequired(),
  }),
  client_phone: yup.string().when('type', {
    is: 'manual',
    then: (schema) => schema.required('Téléphone du client requis pour réservation manuelle'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

/**
 * ReservationDialog Component
 * 
 * Dialog for creating and editing reservations
 * Supports both manual and online reservation types
 */
const ReservationDialog: React.FC<ReservationDialogProps> = ({
  open,
  onClose,
  reservation,
  onSubmit,
  loading = false,
  error,
  availableServices = [],
  availableEmployees = [],
}) => {
  const isEditing = Boolean(reservation && reservation.id);
  
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      service_id: 0,
      employee_id: 0,
      start_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      status: 'CONFIRMED',
      type: 'manual',
      client_full_name: '',
      client_phone: '',
    },
  });

  const watchedType = watch('type');

  // Reset form when dialog opens/closes or reservation changes
  useEffect(() => {
    if (open) {
      if (reservation) {
        reset({
          service_id: reservation.service_id,
          employee_id: reservation.employee_id,
          start_at: format(new Date(reservation.start_at), "yyyy-MM-dd'T'HH:mm"),
          status: reservation.status,
          type: reservation.type,
          client_full_name: reservation.client_full_name || '',
          client_phone: reservation.client_phone || '',
          client_id: reservation.client_id,
        });
      } else {
        reset({
          service_id: 0,
          employee_id: 0,
          start_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          status: 'CONFIRMED',
          type: 'manual',
          client_full_name: '',
          client_phone: '',
        });
      }
    }
  }, [open, reservation, reset]);

  const handleFormSubmit = (data: ReservationFormData) => {
    // Convert datetime-local to ISO string
    const isoStartAt = new Date(data.start_at).toISOString();
    
    onSubmit({
      ...data,
      start_at: isoStartAt,
    });
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="reservation-dialog-title"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle id="reservation-dialog-title">
          {isEditing ? 'Modifier la réservation' : 'Nouvelle réservation'}
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Type Selection */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Type de réservation</InputLabel>
                    <Select
                      {...field}
                      label="Type de réservation"
                      disabled={isEditing} // Don't allow changing type when editing
                    >
                      <MenuItem value="manual">Manuelle</MenuItem>
                      <MenuItem value="online">En ligne</MenuItem>
                    </Select>
                    {errors.type && (
                      <Typography variant="caption" color="error">
                        {errors.type.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      {...field}
                      label="Statut"
                    >
                      <MenuItem value="REQUESTED">Demandé</MenuItem>
                      <MenuItem value="CONFIRMED">Confirmé</MenuItem>
                      <MenuItem value="CANCELLED">Annulé</MenuItem>
                      <MenuItem value="COMPLETED">Terminé</MenuItem>
                    </Select>
                    {errors.status && (
                      <Typography variant="caption" color="error">
                        {errors.status.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Client Information (for manual reservations) */}
            {watchedType === 'manual' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Informations client
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="client_full_name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Nom complet du client"
                        error={!!errors.client_full_name}
                        helperText={errors.client_full_name?.message}
                        required
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
                        fullWidth
                        label="Téléphone du client"
                        error={!!errors.client_phone}
                        helperText={errors.client_phone?.message}
                        required
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Service and Employee Selection */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Service et employé
                </Typography>
              </Divider>
            </Grid>

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
                    >
                      {availableServices.map((service) => (
                        <MenuItem key={service.id} value={service.id}>
                          {service.name} - {service.duration_min}min - {service.price_dhs}DH
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.service_id && (
                      <Typography variant="caption" color="error">
                        {errors.service_id.message}
                      </Typography>
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
                    >
                      {availableEmployees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.employee_id && (
                      <Typography variant="caption" color="error">
                        {errors.employee_id.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Date and Time */}
            <Grid item xs={12}>
              <Controller
                name="start_at"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date et heure"
                    type="datetime-local"
                    error={!!errors.start_at}
                    helperText={errors.start_at?.message}
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReservationDialog; 