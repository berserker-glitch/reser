import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  Save,
  Cancel,
  AccessTime,
  AttachMoney,
  Description,
  Title,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Service, ServiceFormData } from '../../types';

interface ServiceFormProps {
  service?: Service; // For editing existing service
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

// Validation schema
const validationSchema = yup.object({
  name: yup
    .string()
    .required('Le nom du service est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères'),
  description: yup
    .string()
    .optional()
    .max(500, 'La description ne peut pas dépasser 500 caractères'),
  duration_min: yup
    .number()
    .required('La durée est requise')
    .min(15, 'La durée minimale est de 15 minutes')
    .max(480, 'La durée maximale est de 8 heures'),
  price_dhs: yup
    .number()
    .required('Le prix est requis')
    .min(0, 'Le prix ne peut pas être négatif')
    .max(9999.99, 'Le prix ne peut pas dépasser 9999.99 DH'),
}).required();

// Predefined duration options for quick selection
const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 heure' },
  { value: 75, label: '1h 15min' },
  { value: 90, label: '1h 30min' },
  { value: 105, label: '1h 45min' },
  { value: 120, label: '2 heures' },
  { value: 150, label: '2h 30min' },
  { value: 180, label: '3 heures' },
  { value: 240, label: '4 heures' },
];

/**
 * ServiceForm Component
 * 
 * A comprehensive form for creating and editing salon services
 * Features:
 * - Form validation with yup
 * - Predefined duration options
 * - Price formatting
 * - Error handling
 * - Loading states
 * - Responsive design
 */
const ServiceForm: React.FC<ServiceFormProps> = ({
  service,
  onSubmit,
  onCancel,
  loading = false,
  error,
}) => {
  const isEditing = !!service;

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      duration_min: service?.duration_min || 30,
      price_dhs: service?.price_dhs || 0,
    },
    mode: 'onChange',
  });

  // Watch duration for quick selection
  const watchedDuration = watch('duration_min');

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description || '',
        duration_min: service.duration_min,
        price_dhs: service.price_dhs,
      });
    }
  }, [service, reset]);

  const handleFormSubmit = (data: any) => {
    onSubmit(data as ServiceFormData);
  };

  const handleDurationChipClick = (duration: number) => {
    setValue('duration_min', duration, { shouldValidate: true, shouldDirty: true });
  };

  // Format duration display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ width: '100%' }}>
      {/* Form Header */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        {isEditing ? 'Modifier le service' : 'Nouveau service'}
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Service Name */}
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nom du service"
              placeholder="ex: Coupe Femme, Coloration, Brushing..."
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Title color="action" />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />
          )}
        />

        {/* Service Description */}
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description (optionnel)"
              placeholder="Décrivez le service en détail..."
              fullWidth
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                    <Description color="action" />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />
          )}
        />

        {/* Duration Section */}
        <Box>
          <Controller
            name="duration_min"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Durée (minutes)"
                type="number"
                fullWidth
                error={!!errors.duration_min}
                helperText={errors.duration_min?.message || `Durée: ${formatDuration(watchedDuration)}`}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTime color="action" />
                    </InputAdornment>
                  ),
                  inputProps: { min: 15, max: 480, step: 15 },
                }}
                disabled={loading}
              />
            )}
          />

          {/* Quick Duration Selection */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Sélection rapide :
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {durationOptions.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  size="small"
                  variant={watchedDuration === option.value ? 'filled' : 'outlined'}
                  color={watchedDuration === option.value ? 'primary' : 'default'}
                  onClick={() => handleDurationChipClick(option.value)}
                  disabled={loading}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Price */}
        <Controller
          name="price_dhs"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Prix (DH)"
              type="number"
              fullWidth
              error={!!errors.price_dhs}
              helperText={errors.price_dhs?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" color="text.secondary">
                      DH
                    </Typography>
                  </InputAdornment>
                ),
                inputProps: { min: 0, max: 9999.99, step: 0.01 },
              }}
              disabled={loading}
            />
          )}
        />
      </Stack>

      {/* Form Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 4,
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          startIcon={<Cancel />}
        >
          Annuler
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !isDirty || !isValid}
          startIcon={<Save />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
        </Button>
      </Box>
    </Box>
  );
};

export default ServiceForm; 