import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Avatar,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import { BusinessOutlined, PersonAddOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface SalonOwnerFormData {
  // Owner details
  full_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  
  // Salon details  
  salon_name: string;
  salon_description: string;
  salon_address: string;
  salon_phone: string;
  salon_email: string;
}

const steps = ['Owner Details', 'Salon Information', 'Confirmation'];

const SalonSignup: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSalon, setCreatedSalon] = useState<any>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    getValues,
  } = useForm<SalonOwnerFormData>();

  const password = watch('password');

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof SalonOwnerFormData)[] = [];
    
    switch (step) {
      case 0:
        fieldsToValidate = ['full_name', 'email', 'phone', 'password', 'password_confirmation'];
        break;
      case 1:
        fieldsToValidate = ['salon_name', 'salon_description', 'salon_address', 'salon_phone', 'salon_email'];
        break;
    }
    
    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(activeStep);
    if (isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = async (data: SalonOwnerFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/register', {
        role: 'OWNER',
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        salon_name: data.salon_name,
        salon_description: data.salon_description,
        salon_address: data.salon_address,
        salon_phone: data.salon_phone,
        salon_email: data.salon_email,
      });

      if (response.data.success) {
        setCreatedSalon({
          owner: response.data.user,
          salon: response.data.salon,
        });
        setActiveStep(2); // Move to confirmation step
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Registration failed. Please check the provided information.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAddOutlined color="primary" />
              Owner Account Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create the salon owner's account credentials
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  {...register('full_name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                  fullWidth
                  label="Full Name"
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  fullWidth
                  label="Email Address"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('phone', {
                    required: 'Phone number is required',
                  })}
                  fullWidth
                  label="Phone Number"
                  placeholder="+212-600-000-000"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  fullWidth
                  label="Password"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('password_confirmation', {
                    required: 'Password confirmation is required',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  error={!!errors.password_confirmation}
                  helperText={errors.password_confirmation?.message}
                  disabled={isLoading}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessOutlined color="primary" />
              Salon Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Setup the salon details and contact information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  {...register('salon_name', {
                    required: 'Salon name is required',
                    minLength: { value: 2, message: 'Salon name must be at least 2 characters' },
                  })}
                  fullWidth
                  label="Salon Name"
                  error={!!errors.salon_name}
                  helperText={errors.salon_name?.message}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  {...register('salon_description')}
                  fullWidth
                  label="Salon Description"
                  multiline
                  rows={3}
                  placeholder="Describe your salon's specialties and atmosphere..."
                  error={!!errors.salon_description}
                  helperText={errors.salon_description?.message}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  {...register('salon_address', {
                    required: 'Salon address is required',
                  })}
                  fullWidth
                  label="Salon Address"
                  multiline
                  rows={2}
                  error={!!errors.salon_address}
                  helperText={errors.salon_address?.message}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('salon_phone', {
                    required: 'Salon phone is required',
                  })}
                  fullWidth
                  label="Salon Phone"
                  placeholder="+212-500-000-000"
                  error={!!errors.salon_phone}
                  helperText={errors.salon_phone?.message}
                  disabled={isLoading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('salon_email', {
                    required: 'Salon email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  fullWidth
                  label="Salon Email"
                  type="email"
                  error={!!errors.salon_email}
                  helperText={errors.salon_email?.message}
                  disabled={isLoading}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CheckCircleOutlined sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" color="success.main" gutterBottom>
                Salon Account Created Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The salon owner account and salon have been set up.
              </Typography>
            </Box>

            {createdSalon && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Owner Details
                      </Typography>
                      <Typography variant="body2"><strong>Name:</strong> {createdSalon.owner.full_name}</Typography>
                      <Typography variant="body2"><strong>Email:</strong> {createdSalon.owner.email}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {createdSalon.owner.phone}</Typography>
                      <Chip label={createdSalon.owner.role} color="primary" size="small" sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Salon Details
                      </Typography>
                      <Typography variant="body2"><strong>Name:</strong> {createdSalon.salon.name}</Typography>
                      <Typography variant="body2"><strong>Email:</strong> {createdSalon.salon.email}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {createdSalon.salon.phone}</Typography>
                      <Typography variant="body2"><strong>Address:</strong> {createdSalon.salon.address}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <BusinessOutlined fontSize="large" />
            </Avatar>
            <Typography component="h1" variant="h4" gutterBottom>
              Create New Salon
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Register a new salon owner and setup their salon
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form Content */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent(activeStep)}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep === 2 ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/admin')}
                    >
                      Back to Dashboard
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => window.location.reload()}
                    >
                      Create Another Salon
                    </Button>
                  </>
                ) : activeStep === steps.length - 2 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <BusinessOutlined />}
                  >
                    {isLoading ? 'Creating...' : 'Create Salon'}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SalonSignup; 