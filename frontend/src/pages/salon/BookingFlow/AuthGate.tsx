import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Phone,
  ArrowForward,
  Login,
  PersonAdd,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useBookingStore } from '../../../store/bookingStore';
import { createGuestBooking, associateUserWithSalon } from '../../../services/salonApi';
import BookingLayout from './BookingLayout';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

/**
 * AuthGate Component
 * 
 * Fourth step of the booking flow where users must authenticate
 * Features:
 * - Login/Register tabs
 * - Form validation
 * - Creates temporary booking before auth
 * - Associates user with salon after auth
 * - Proceeds to confirmation
 */
const AuthGate: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const navigate = useNavigate();
  
  const {
    salon,
    selectedService,
    selectedEmployee,
    selectedDateTime,
    setTempBooking,
    setCurrentStep,
    canProceedToStep,
  } = useBookingStore();

  // Local state
  const [authTab, setAuthTab] = useState(0); // 0 = login, 1 = register
  const [error, setError] = useState<string | null>(null);

  // Forms
  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  // Set current step
  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  // Redirect if previous steps not completed
  useEffect(() => {
    if (!selectedService) {
      navigate(`/salon/${salonSlug}/book/service`);
      return;
    }
    if (selectedEmployee === undefined) {
      navigate(`/salon/${salonSlug}/book/employee`);
      return;
    }
    if (!selectedDateTime) {
      navigate(`/salon/${salonSlug}/book/datetime`);
      return;
    }
  }, [selectedService, selectedEmployee, selectedDateTime, navigate, salonSlug]);

  // Create guest booking mutation
  const createGuestBookingMutation = useMutation({
    mutationFn: (data: {
      client_name: string;
      client_email: string;
      client_phone: string;
    }) => createGuestBooking(salonSlug!, {
      service_id: selectedService!.id,
      employee_id: selectedEmployee?.id,
      start_at: selectedDateTime!,
      client_name: data.client_name,
      client_phone: data.client_phone,
      client_email: data.client_email,
    }),
    onSuccess: (response) => {
      setTempBooking(response.temp_booking);
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create booking');
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: async (response) => {
      // Store token
      const token = response.authorization?.token || response.token;
      localStorage.setItem('access_token', token);
      
      // Wait a moment for token to be stored
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Associate user with salon
      if (salon) {
        try {
          await associateUserWithSalon(salon.id);
        } catch (error) {
          // Don't block the flow if association fails
        }
      }
      
      // Proceed to confirmation
      setCurrentStep(5);
      navigate(`/salon/${salonSlug}/book/confirm`);
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: 'CLIENT',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: async (response) => {
      // Store token
      const token = response.authorization?.token || response.token;
      localStorage.setItem('access_token', token);
      
      // Wait a moment for token to be stored
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Associate user with salon
      if (salon) {
        try {
          await associateUserWithSalon(salon.id);
        } catch (error) {
          // Don't block the flow if association fails
        }
      }
      
      // Proceed to confirmation
      setCurrentStep(5);
      navigate(`/salon/${salonSlug}/book/confirm`);
    },
    onError: (error: any) => {
      setError(error.message || 'Registration failed');
    },
  });

  // Handle login submission
  const handleLogin = (data: LoginForm) => {
    setError(null);
    
    // First create guest booking, then login
    const registerData = {
      client_name: 'Guest User', // Will be updated after login
      client_email: data.email,
      client_phone: 'N/A', // Will be updated after login
    };
    
    createGuestBookingMutation.mutate(registerData, {
      onSuccess: () => {
        loginMutation.mutate(data);
      },
    });
  };

  // Handle register submission
  const handleRegister = (data: RegisterForm) => {
    setError(null);
    
    if (data.password !== data.password_confirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    // First create guest booking, then register
    const bookingData = {
      client_name: data.full_name,
      client_email: data.email,
      client_phone: data.phone,
    };
    
    createGuestBookingMutation.mutate(bookingData, {
      onSuccess: () => {
        registerMutation.mutate(data);
      },
    });
  };

  const isLoading = createGuestBookingMutation.isPending || loginMutation.isPending || registerMutation.isPending;

  return (
    <BookingLayout
      title="Finalisez votre réservation"
      subtitle="Connectez-vous ou créez un compte pour confirmer votre réservation"
      currentStep={4}
      showBackButton={true}
      showHomeButton={true}
    >
      <Box>
        {/* Booking Summary */}
        {selectedService && selectedDateTime && (
          <Card 
            elevation={1}
            sx={{ 
              p: 3, 
              mb: 4, 
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.200',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              Récapitulatif de votre réservation
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Service:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedService.name}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Employé:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedEmployee ? selectedEmployee.full_name : 'N\'importe quel employé disponible'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Date et heure:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date(selectedDateTime).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Prix:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedService.price_dhs} DH
                </Typography>
              </Box>
            </Box>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Auth Card */}
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={authTab} 
                onChange={(_, newValue) => setAuthTab(newValue)}
                variant="fullWidth"
              >
                <Tab 
                  icon={<Login />} 
                  label="Se connecter" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
                <Tab 
                  icon={<PersonAdd />} 
                  label="Créer un compte" 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Login Tab */}
              {authTab === 0 && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      {...loginForm.register('email', { required: 'Email requis' })}
                      label="Adresse email"
                      type="email"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      error={!!loginForm.formState.errors.email}
                      helperText={loginForm.formState.errors.email?.message}
                    />

                    <TextField
                      {...loginForm.register('password', { required: 'Mot de passe requis' })}
                      label="Mot de passe"
                      type="password"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      error={!!loginForm.formState.errors.password}
                      helperText={loginForm.formState.errors.password?.message}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={isLoading}
                      endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      {isLoading ? 'Connexion...' : 'Se connecter et réserver'}
                    </Button>
                  </Box>
                </form>
              )}

              {/* Register Tab */}
              {authTab === 1 && (
                <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      {...registerForm.register('full_name', { required: 'Nom complet requis' })}
                      label="Nom complet"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      error={!!registerForm.formState.errors.full_name}
                      helperText={registerForm.formState.errors.full_name?.message}
                    />

                    <TextField
                      {...registerForm.register('email', { required: 'Email requis' })}
                      label="Adresse email"
                      type="email"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      error={!!registerForm.formState.errors.email}
                      helperText={registerForm.formState.errors.email?.message}
                    />

                    <TextField
                      {...registerForm.register('phone', { required: 'Téléphone requis' })}
                      label="Numéro de téléphone"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      error={!!registerForm.formState.errors.phone}
                      helperText={registerForm.formState.errors.phone?.message}
                    />

                    <TextField
                      {...registerForm.register('password', { 
                        required: 'Mot de passe requis',
                        minLength: { value: 6, message: 'Le mot de passe doit contenir au moins 6 caractères' }
                      })}
                      label="Mot de passe"
                      type="password"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      error={!!registerForm.formState.errors.password}
                      helperText={registerForm.formState.errors.password?.message}
                    />

                    <TextField
                      {...registerForm.register('password_confirmation', { required: 'Confirmation requise' })}
                      label="Confirmer le mot de passe"
                      type="password"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                      error={!!registerForm.formState.errors.password_confirmation}
                      helperText={registerForm.formState.errors.password_confirmation?.message}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={isLoading}
                      endIcon={isLoading ? <CircularProgress size={20} /> : <ArrowForward />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      {isLoading ? 'Création du compte...' : 'Créer un compte et réserver'}
                    </Button>
                  </Box>
                </form>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Info Text */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </Typography>
        </Box>
      </Box>
    </BookingLayout>
  );
};

export default AuthGate; 