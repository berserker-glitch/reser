import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Lock,
  Phone,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
  confirmPassword: string;
}

const ClientLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 = Login, 1 = Register

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

      if (response.data.success && response.data.user.role === 'CLIENT') {
        // Store token and user data
        localStorage.setItem('client_token', response.data.authorization.token);
        localStorage.setItem('client_user', JSON.stringify(response.data.user));
        
        // Redirect to client dashboard
        navigate('/client');
      } else if (response.data.user.role !== 'CLIENT') {
        setError('Ce compte est réservé au personnel. Veuillez utiliser un compte client.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Connexion échouée. Vérifiez vos identifiants.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    if (data.password !== data.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/auth/register', {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.confirmPassword,
        role: 'CLIENT',
      });

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('client_token', response.data.authorization.token);
        localStorage.setItem('client_user', JSON.stringify(response.data.user));
        
        // Redirect to client dashboard
        navigate('/client');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Inscription échouée. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            width: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              💇‍♀️ Salon Réservation
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Réservez votre rendez-vous en quelques clics
            </Typography>
          </Box>

          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => {
                setTabValue(newValue);
                setError(null);
              }}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab label="Se connecter" />
              <Tab label="S'inscrire" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            {tabValue === 0 && (
              <Box component="form" onSubmit={loginForm.handleSubmit(onLogin)}>
                <TextField
                  fullWidth
                  label="Email"
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
                    required: 'Email requis',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Email invalide',
                    },
                  })}
                  error={!!loginForm.formState.errors.email}
                  helperText={loginForm.formState.errors.email?.message}
                />

                <TextField
                  fullWidth
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
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
                    required: 'Mot de passe requis',
                  })}
                  error={!!loginForm.formState.errors.password}
                  helperText={loginForm.formState.errors.password?.message}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Se connecter'}
                </Button>
              </Box>
            )}

            {/* Register Form */}
            {tabValue === 1 && (
              <Box component="form" onSubmit={registerForm.handleSubmit(onRegister)}>
                <TextField
                  fullWidth
                  label="Nom complet"
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                  {...registerForm.register('full_name', {
                    required: 'Nom complet requis',
                  })}
                  error={!!registerForm.formState.errors.full_name}
                  helperText={registerForm.formState.errors.full_name?.message}
                />

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  {...registerForm.register('email', {
                    required: 'Email requis',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Email invalide',
                    },
                  })}
                  error={!!registerForm.formState.errors.email}
                  helperText={registerForm.formState.errors.email?.message}
                />

                <TextField
                  fullWidth
                  label="Téléphone"
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                  {...registerForm.register('phone', {
                    required: 'Téléphone requis',
                  })}
                  error={!!registerForm.formState.errors.phone}
                  helperText={registerForm.formState.errors.phone?.message}
                />

                <TextField
                  fullWidth
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
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
                    required: 'Mot de passe requis',
                    minLength: {
                      value: 6,
                      message: 'Au moins 6 caractères',
                    },
                  })}
                  error={!!registerForm.formState.errors.password}
                  helperText={registerForm.formState.errors.password?.message}
                />

                <TextField
                  fullWidth
                  label="Confirmer le mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                  {...registerForm.register('confirmPassword', {
                    required: 'Confirmation requise',
                  })}
                  error={!!registerForm.formState.errors.confirmPassword}
                  helperText={registerForm.formState.errors.confirmPassword?.message}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : "S'inscrire"}
                </Button>
              </Box>
            )}

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                href="/"
                sx={{ color: 'text.secondary', textDecoration: 'none' }}
              >
                ← Retour à l'accueil
              </Link>
            </Box>
          </Paper>
        </Paper>
      </Box>
    </Container>
  );
};

export default ClientLogin; 