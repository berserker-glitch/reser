import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  LinearProgress,
  Button,
  IconButton,
} from '@mui/material';
import { ArrowBack, Home } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useBookingStore } from '../../../store/bookingStore';

interface BookingLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  currentStep: number;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

/**
 * BookingLayout Component
 * 
 * Common layout for all booking flow steps with:
 * - Salon branding header
 * - Progress stepper
 * - Navigation controls
 * - Error handling
 */
const BookingLayout: React.FC<BookingLayoutProps> = ({
  children,
  title,
  subtitle,
  currentStep,
  showBackButton = true,
  showHomeButton = true,
}) => {
  const navigate = useNavigate();
  const { salonSlug } = useParams<{ salonSlug: string }>();
  
  const {
    salon,
    steps,
    isLoading,
    error,
    setCurrentStep,
    canProceedToStep,
  } = useBookingStore();

  // Handle navigation
  const handleBack = () => {
    if (currentStep > 1) {
      const previousStep = currentStep - 1;
      setCurrentStep(previousStep);
      const previousPath = steps[previousStep - 1]?.path;
      if (previousPath && salonSlug) {
        navigate(`/salon/${salonSlug}${previousPath}`);
      }
    } else {
      // Go back to salon homepage
      navigate(`/salon/${salonSlug}`);
    }
  };

  const handleHome = () => {
    navigate(`/salon/${salonSlug}`);
  };

  const handleStepClick = (stepNumber: number) => {
    if (canProceedToStep(stepNumber)) {
      setCurrentStep(stepNumber);
      const stepPath = steps[stepNumber - 1]?.path;
      if (stepPath && salonSlug) {
        navigate(`/salon/${salonSlug}${stepPath}`);
      }
    }
  };

  // Calculate progress percentage
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'grey.50',
      py: 2,
    }}>
      <Container maxWidth="lg">
        {/* Header with salon info */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {showBackButton && (
                <IconButton 
                  onClick={handleBack}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <ArrowBack />
                </IconButton>
              )}
              
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {salon?.name || 'Salon'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Réservation en ligne
                </Typography>
              </Box>
            </Box>

            {showHomeButton && (
              <IconButton 
                onClick={handleHome}
                sx={{ color: 'white' }}
                size="small"
              >
                <Home />
              </IconButton>
            )}
          </Box>

          {/* Progress bar */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Étape {currentStep} sur {steps.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {Math.round(progressPercentage)}% terminé
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage}
              sx={{ 
                height: 6, 
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                }
              }}
            />
          </Box>
        </Paper>

        {/* Step indicator */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Stepper activeStep={currentStep - 1} alternativeLabel>
            {steps.map((step, index) => (
              <Step 
                key={step.step} 
                completed={step.completed}
                onClick={() => handleStepClick(step.step)}
                sx={{ 
                  cursor: canProceedToStep(step.step) ? 'pointer' : 'default',
                  opacity: canProceedToStep(step.step) ? 1 : 0.6,
                }}
              >
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-labelContainer': {
                      cursor: canProceedToStep(step.step) ? 'pointer' : 'default',
                    }
                  }}
                >
                  {step.name}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Loading indicator */}
        {isLoading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main content */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Content header */}
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Content body */}
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </Paper>

        {/* Footer info */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Vous avez des questions? Contactez {salon?.name} au {salon?.phone || 'téléphone non disponible'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default BookingLayout; 