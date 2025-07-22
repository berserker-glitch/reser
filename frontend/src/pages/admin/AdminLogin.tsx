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
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import { 
  LockOutlined,
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  Business,
  Store,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  salon_name: string;
  salon_description: string;
  salon_address: string;
  salon_phone: string;
  salon_email: string;
}

const steps = ['Owner Account', 'Salon Details', 'Review'];

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  
  const loginForm = useForm<LoginFormData>();
  const registerForm = useForm<RegisterFormData>();

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      if (response.data.success && response.data.user.role === 'OWNER') {
        localStorage.setItem('admin_token', response.data.authorization.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.user));
        
        // Store salon data if present (for proper salon_id filtering)
        if (response.data.salon) {
          localStorage.setItem('admin_salon', JSON.stringify(response.data.salon));
        }
        
        navigate('/admin');
      } else if (response.data.user.role !== 'OWNER') {
        setError('Access denied. Admin privileges required.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/register', {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role: 'OWNER',
        salon_name: data.salon_name,
        salon_description: data.salon_description,
        salon_address: data.salon_address,
        salon_phone: data.salon_phone,
        salon_email: data.salon_email,
      });

      if (response.data.success) {
        localStorage.setItem('admin_token', response.data.authorization.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.user));
        
        // Store salon data if present (for proper salon_id filtering)
        if (response.data.salon) {
          localStorage.setItem('admin_salon', JSON.stringify(response.data.salon));
        }
        
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Registration error:', err.response?.data);
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(Array.isArray(errorMessages) ? errorMessages.join(', ') : 'Registration failed');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = async (step: number) => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    
    switch (step) {
      case 0:
        fieldsToValidate = ['full_name', 'email', 'phone', 'password', 'password_confirmation'];
        break;
      case 1:
        fieldsToValidate = ['salon_name', 'salon_address'];
        break;
    }
    
    const result = await registerForm.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(activeStep);
    if (isValid) {
      if (activeStep === steps.length - 1) {
        registerForm.handleSubmit(onRegister)();
      } else {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Person color="primary" />
                Owner Account Details
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('full_name', {
                  required: 'Full name is required',
                })}
                error={!!registerForm.formState.errors.full_name}
                helperText={registerForm.formState.errors.full_name?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={!!registerForm.formState.errors.email}
                helperText={registerForm.formState.errors.email?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('phone', {
                  required: 'Phone number is required',
                })}
                error={!!registerForm.formState.errors.phone}
                helperText={registerForm.formState.errors.phone?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                error={!!registerForm.formState.errors.password}
                helperText={registerForm.formState.errors.password?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('password_confirmation', {
                  required: 'Please confirm your password',
                  validate: (value) => {
                    const password = registerForm.getValues('password');
                    return password === value || 'Passwords do not match';
                  },
                })}
                error={!!registerForm.formState.errors.password_confirmation}
                helperText={registerForm.formState.errors.password_confirmation?.message}
                disabled={isLoading}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Store color="primary" />
                Salon Information
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Salon Name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Store />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('salon_name', {
                  required: 'Salon name is required',
                })}
                error={!!registerForm.formState.errors.salon_name}
                helperText={registerForm.formState.errors.salon_name?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Salon Description"
                multiline
                rows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                      <Business />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('salon_description')}
                error={!!registerForm.formState.errors.salon_description}
                helperText={registerForm.formState.errors.salon_description?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Salon Address"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('salon_address', {
                  required: 'Salon address is required',
                })}
                error={!!registerForm.formState.errors.salon_address}
                helperText={registerForm.formState.errors.salon_address?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salon Phone"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('salon_phone')}
                error={!!registerForm.formState.errors.salon_phone}
                helperText={registerForm.formState.errors.salon_phone?.message}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salon Email"
                type="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                {...registerForm.register('salon_email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={!!registerForm.formState.errors.salon_email}
                helperText={registerForm.formState.errors.salon_email?.message}
                disabled={isLoading}
              />
            </Grid>
          </Grid>
        );

      case 2:
        const formData = registerForm.getValues();
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Review Your Information
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Owner Details
                </Typography>
                <Typography variant="body2">Name: {formData.full_name}</Typography>
                <Typography variant="body2">Email: {formData.email}</Typography>
                <Typography variant="body2">Phone: {formData.phone}</Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Salon Details
                </Typography>
                <Typography variant="body2">Salon Name: {formData.salon_name}</Typography>
                <Typography variant="body2">Address: {formData.salon_address}</Typography>
                {formData.salon_description && (
                  <Typography variant="body2">Description: {formData.salon_description}</Typography>
                )}
                {formData.salon_phone && (
                  <Typography variant="body2">Salon Phone: {formData.salon_phone}</Typography>
                )}
                {formData.salon_email && (
                  <Typography variant="body2">Salon Email: {formData.salon_email}</Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: tabValue === 1 ? 800 : 450,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlined />
            </Avatar>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              Admin Portal
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Salon Reservation System
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => {
                setTabValue(newValue);
                setError(null);
                setActiveStep(0);
              }}
              variant="fullWidth"
              sx={{ 
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                },
              }}
            >
              <Tab label="Sign In" />
              <Tab label="Create Account" />
            </Tabs>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          {tabValue === 0 && (
            <Box component="form" onSubmit={loginForm.handleSubmit(onLogin)} noValidate>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                {...loginForm.register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={!!loginForm.formState.errors.email}
                helperText={loginForm.formState.errors.email?.message}
                disabled={isLoading}
              />
              
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                {...loginForm.register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                error={!!loginForm.formState.errors.password}
                helperText={loginForm.formState.errors.password?.message}
                disabled={isLoading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>
          )}

          {/* Register Form */}
          {tabValue === 1 && (
            <Box>
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Step Content */}
              <Box sx={{ mb: 4 }}>
                {renderStepContent(activeStep)}
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <Button
                  color="inherit"
                  disabled={activeStep === 0 || isLoading}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isLoading}
                  size="large"
                  sx={{ px: 4 }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : activeStep === steps.length - 1 ? (
                    'Create Account'
                  ) : (
                    'Next'
                  )}
                </Button>
              </Box>
            </Box>
          )}

          {/* Demo Credentials (only show on login tab) */}
          {tabValue === 0 && (
            <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  <strong>Demo Credentials:</strong><br />
                  Email: owner@salon.com<br />
                  Password: password123
                </Typography>
              </CardContent>
            </Card>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin; 