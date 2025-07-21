import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Alert,
  Chip,
  Stack,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  IconButton,
} from '@mui/material';
import {
  Save,
  Cancel,
  Person,
  Phone,
  Notes,
  Work,
  PhotoCamera,
  Delete,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import type { Employee, EmployeeFormData, Service } from '../../types';

interface EmployeeFormProps {
  employee?: Employee; // For editing existing employee
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  availableServices?: Service[]; // Services that can be assigned
}

// Validation schema
const validationSchema = yup.object({
  full_name: yup
    .string()
    .required('Le nom complet est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(120, 'Le nom ne peut pas dépasser 120 caractères'),
  phone: yup
    .string()
    .optional()
    .min(8, 'Le numéro doit contenir au moins 8 chiffres')
    .max(15, 'Le numéro ne peut pas dépasser 15 caractères'),
  note: yup
    .string()
    .optional()
    .max(500, 'La note ne peut pas dépasser 500 caractères'),
  profile_picture: yup
    .string()
    .optional(),
  service_ids: yup
    .array()
    .of(yup.number())
    .optional(),
}).required();

/**
 * EmployeeForm Component
 * 
 * A comprehensive form for creating and editing salon employees
 * Features:
 * - Form validation with yup
 * - Profile picture upload
 * - Service assignment
 * - Error handling
 * - Loading states
 * - Responsive design
 */
const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel,
  loading = false,
  error,
  availableServices = [],
}) => {
  const isEditing = !!employee;
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');

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
      full_name: employee?.full_name || '',
      phone: employee?.phone || '',
      note: employee?.note || '',
      profile_picture: employee?.profile_picture || '',
      service_ids: employee?.services?.map(s => s.id) || [],
    },
    mode: 'onChange',
  });



  // Watch for changes
  const watchedServiceIds = watch('service_ids');

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      reset({
        full_name: employee.full_name,
        phone: employee.phone || '',
        note: employee.note || '',
        profile_picture: employee.profile_picture || '',
        service_ids: employee.services?.map(s => s.id) || [],
      });
      setProfilePicturePreview(employee.profile_picture || '');
    }
  }, [employee, reset]);

  const handleFormSubmit = (data: any) => {
    const formData: EmployeeFormData = {
      ...data,
      profile_picture: profilePicturePreview || undefined,
    };
    onSubmit(formData);
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, create a preview URL. In a real app, you'd upload to a server
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePicturePreview(result);
        setValue('profile_picture', result, { shouldValidate: true, shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove profile picture
  const handleRemoveProfilePicture = () => {
    setProfilePicturePreview('');
    setValue('profile_picture', '', { shouldValidate: true, shouldDirty: true });
  };

  // Handle service selection
  const handleServiceChange = (event: any) => {
    const value = event.target.value as number[];
    setValue('service_ids', value, { shouldValidate: true, shouldDirty: true });
  };

  // Get employee initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ width: '100%' }}>
      {/* Form Header */}
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        {isEditing ? 'Modifier l\'employé' : 'Nouvel employé'}
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Profile Picture Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={profilePicturePreview}
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontWeight: 600,
            }}
          >
            {!profilePicturePreview && watch('full_name') && getInitials(watch('full_name'))}
          </Avatar>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCamera />}
              size="small"
              disabled={loading}
            >
              {profilePicturePreview ? 'Changer' : 'Ajouter'} Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleProfilePictureChange}
              />
            </Button>
            
            {profilePicturePreview && (
              <IconButton
                onClick={handleRemoveProfilePicture}
                disabled={loading}
                size="small"
                color="error"
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Employee Name */}
        <Controller
          name="full_name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nom complet"
              placeholder="ex: Ahmed Benjelloun, Fatima Chraibi..."
              fullWidth
              error={!!errors.full_name}
              helperText={errors.full_name?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />
          )}
        />

        {/* Phone Number */}
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Téléphone (optionnel)"
              placeholder="ex: +212612345678 ou 0612345678"
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />
          )}
        />

        {/* Services Assignment */}
        <FormControl fullWidth>
          <InputLabel>Services assignés</InputLabel>
          <Controller
            name="service_ids"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                multiple
                value={field.value || []}
                onChange={handleServiceChange}
                input={<OutlinedInput label="Services assignés" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as number[]).map((serviceId) => {
                      const service = availableServices.find(s => s.id === serviceId);
                      return (
                        <Chip 
                          key={serviceId} 
                          label={service?.name || `Service ${serviceId}`} 
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
                disabled={loading}
                startAdornment={
                  <InputAdornment position="start">
                    <Work color="action" />
                  </InputAdornment>
                }
              >
                {availableServices.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    <Box>
                      <Typography variant="body2">{service.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {service.duration_min}min - {service.price_dhs} DH
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>

        {/* Notes */}
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Notes (optionnel)"
              placeholder="Spécialités, compétences particulières, notes importantes..."
              fullWidth
              multiline
              rows={3}
              error={!!errors.note}
              helperText={errors.note?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                    <Notes color="action" />
                  </InputAdornment>
                ),
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
          disabled={loading || !isValid}
          startIcon={<Save />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
        </Button>
      </Box>
    </Box>
  );
};

export default EmployeeForm; 