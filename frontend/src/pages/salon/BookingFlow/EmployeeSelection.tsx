import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  Person,
  ArrowForward,
  CheckCircle,
  Shuffle,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useBookingStore, type Employee } from '../../../store/bookingStore';
import { fetchSalonBySlug, type SalonDiscoveryResponse } from '../../../services/salonApi';
import BookingLayout from './BookingLayout';

/**
 * EmployeeSelection Component
 * 
 * Second step of the booking flow where users select their preferred employee
 * Features:
 * - Display all employees who can perform the selected service
 * - Option to select "any available" employee
 * - Employee details and specialties
 * - Continue to next step when employee is selected
 */
const EmployeeSelection: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const navigate = useNavigate();
  
  const {
    salon,
    selectedService,
    selectedEmployee,
    setEmployee,
    setCurrentStep,
    canProceedToStep,
  } = useBookingStore();

  // Fetch salon data if not already loaded
  const { 
    data: salonData, 
    isLoading, 
    error 
  } = useQuery<SalonDiscoveryResponse>({
    queryKey: ['salon', salonSlug],
    queryFn: () => fetchSalonBySlug(salonSlug!),
    enabled: !!salonSlug && !salon,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Set current step
  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Redirect if no service selected
  useEffect(() => {
    if (!selectedService && !isLoading) {
      navigate(`/salon/${salonSlug}/book/service`);
    }
  }, [selectedService, isLoading, navigate, salonSlug]);

  // Filter employees who can perform the selected service
  const availableEmployees = React.useMemo(() => {
    if (!salonData?.employees || !selectedService) return [];
    
    return salonData.employees.filter(employee => {
      // If employee has no services listed, assume they can do all services
      if (!employee.services || employee.services.length === 0) {
        return true;
      }
      
      // Check if employee can perform the selected service
      return employee.services.some(service => service.id === selectedService.id);
    });
  }, [salonData?.employees, selectedService]);

  // Handle employee selection
  const handleEmployeeSelect = (employee: Employee | null) => {
    if (employee) {
      const employeeData: Employee = {
        id: employee.id,
        full_name: employee.full_name,
        phone: employee.phone,
        profile_picture: employee.profile_picture,
        note: employee.note,
        salon_id: employee.salon_id,
        services: employee.services,
      };
      setEmployee(employeeData);
    } else {
      // "Any available" option
      setEmployee(null);
    }
  };

  // Handle continue to next step
  const handleContinue = () => {
    if (canProceedToStep(3)) {
      setCurrentStep(3);
      navigate(`/salon/${salonSlug}/book/datetime`);
    }
  };

  if (isLoading) {
    return (
      <BookingLayout
        title="Choisissez votre employé"
        subtitle="Sélectionnez l'employé de votre choix"
        currentStep={2}
        showBackButton={true}
        showHomeButton={true}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Chargement des employés...
            </Typography>
          </Box>
        </Box>
      </BookingLayout>
    );
  }

  if (error || !salonData) {
    return (
      <BookingLayout
        title="Erreur"
        currentStep={2}
        showBackButton={true}
        showHomeButton={true}
      >
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Impossible de charger les employés
          </Typography>
          <Typography variant="body2">
            Une erreur s'est produite lors du chargement des employés. Veuillez réessayer.
          </Typography>
        </Alert>
      </BookingLayout>
    );
  }

  return (
    <BookingLayout
      title="Choisissez votre employé"
      subtitle={`Sélectionnez l'employé de votre choix pour ${selectedService?.name}`}
      currentStep={2}
      showBackButton={true}
      showHomeButton={true}
    >
      <Box>
        {/* Selected Service Summary */}
        {selectedService && (
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
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
              Service sélectionné
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {selectedService.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedService.duration_min} minutes • {selectedService.price_dhs} DH
            </Typography>
          </Card>
        )}

        {/* "Any Available" Option */}
        <Card 
          elevation={selectedEmployee === null ? 4 : 2}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            cursor: 'pointer',
            position: 'relative',
            border: selectedEmployee === null ? '2px solid' : '2px solid transparent',
            borderColor: selectedEmployee === null ? 'secondary.main' : 'transparent',
            transition: 'all 0.3s ease',
            transform: selectedEmployee === null ? 'scale(1.02)' : 'scale(1)',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: 4,
            },
          }}
          onClick={() => handleEmployeeSelect(null)}
        >
          {/* Selection indicator */}
          {selectedEmployee === null && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 1,
              }}
            >
              <CheckCircle color="secondary" />
            </Box>
          )}

          <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: 'secondary.main',
                color: 'white',
              }}
            >
              <Shuffle />
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: selectedEmployee === null ? 'secondary.main' : 'text.primary',
                  mb: 1,
                }}
              >
                N'importe quel employé disponible
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Laissez-nous choisir le meilleur employé disponible pour votre créneau
              </Typography>
              <Chip 
                label="Recommandé" 
                color="secondary" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </Box>

            <Button
              variant={selectedEmployee === null ? 'contained' : 'outlined'}
              color="secondary"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleEmployeeSelect(null);
              }}
            >
              {selectedEmployee === null ? 'Sélectionné' : 'Sélectionner'}
            </Button>
          </CardContent>
        </Card>

        {/* Specific Employees */}
        {availableEmployees.length > 0 && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Ou choisissez un employé spécifique:
            </Typography>

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
              gap: 3, 
              mb: 4 
            }}>
              {availableEmployees.map((employee) => {
                const isSelected = selectedEmployee?.id === employee.id;
                
                return (
                  <Box key={employee.id}>
                    <Card 
                      elevation={isSelected ? 4 : 2}
                      sx={{ 
                        borderRadius: 2,
                        cursor: 'pointer',
                        position: 'relative',
                        border: isSelected ? '2px solid' : '2px solid transparent',
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        transition: 'all 0.3s ease',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 1,
                          }}
                        >
                          <CheckCircle color="primary" />
                        </Box>
                      )}

                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                          <Avatar
                            sx={{ 
                              width: 60, 
                              height: 60,
                              bgcolor: 'primary.main',
                            }}
                            src={employee.profile_picture}
                          >
                            {employee.full_name.charAt(0)}
                          </Avatar>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                color: isSelected ? 'primary.main' : 'text.primary',
                              }}
                            >
                              {employee.full_name}
                            </Typography>
                            
                            {employee.note && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {employee.note}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Employee specialties */}
                        {employee.services && employee.services.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                              Spécialités:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {employee.services.slice(0, 3).map((service: any) => (
                                <Chip 
                                  key={service.id}
                                  label={service.name}
                                  size="small"
                                  variant="outlined"
                                  color={service.id === selectedService?.id ? 'primary' : 'default'}
                                />
                              ))}
                              {employee.services.length > 3 && (
                                <Chip 
                                  label={`+${employee.services.length - 3}`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                            </Box>
                          </Box>
                        )}

                        <Button
                          variant={isSelected ? 'contained' : 'outlined'}
                          fullWidth
                          sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmployeeSelect(employee);
                          }}
                        >
                          {isSelected ? 'Employé sélectionné' : 'Sélectionner cet employé'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* No employees available */}
        {availableEmployees.length === 0 && (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Aucun employé spécialisé disponible
            </Typography>
            <Typography variant="body2">
              Aucun employé spécialisé dans ce service n'a été trouvé. 
              Vous pouvez sélectionner "N'importe quel employé disponible" ci-dessus.
            </Typography>
          </Alert>
        )}

        {/* Selected Employee Summary */}
        {selectedEmployee && (
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
              Employé sélectionné
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={selectedEmployee.profile_picture}>
                  {selectedEmployee.full_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedEmployee.full_name}
                  </Typography>
                  {selectedEmployee.note && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedEmployee.note}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => setEmployee(null)}
                sx={{ minWidth: 'auto' }}
              >
                Changer
              </Button>
            </Box>
          </Card>
        )}

        {/* Continue Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {selectedEmployee || selectedEmployee === null
              ? 'Parfait! Continuez pour choisir votre créneau.'
              : 'Sélectionnez un employé pour continuer.'
            }
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={handleContinue}
            disabled={selectedEmployee === undefined} // undefined means no selection, null means "any available"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Continuer
          </Button>
        </Box>
      </Box>
    </BookingLayout>
  );
};

export default EmployeeSelection; 