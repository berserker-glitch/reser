import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Chip,
  Stack,
} from '@mui/material';
import {
  PersonAdd,
  Schedule,
  Assignment,
  Analytics,
} from '@mui/icons-material';

/**
 * EmployeesManagement Component
 * 
 * Admin page for managing salon employees
 * Features to be implemented:
 * - Add, edit, and remove employees
 * - Assign services to employees
 * - Manage working hours and schedules
 * - View employee performance metrics
 */
function EmployeesManagement() {
  // Placeholder features list
  const upcomingFeatures = [
    { icon: <PersonAdd />, title: 'Gestion des Employés', description: 'Ajouter, modifier et supprimer les employés' },
    { icon: <Schedule />, title: 'Horaires de Travail', description: 'Définir les heures de travail et pauses' },
    { icon: <Assignment />, title: 'Attribution des Services', description: 'Assigner des services spécifiques aux employés' },
    { icon: <Analytics />, title: 'Statistiques', description: 'Analyser les performances et la productivité' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Gestion des Employés
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Gérez votre équipe et leurs compétences
        </Typography>
        <Chip 
          label="Bientôt Disponible" 
          color="primary" 
          variant="outlined" 
          size="medium"
          sx={{ fontSize: '1rem', py: 1, px: 2 }}
        />
      </Box>

      {/* Coming Soon Features */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'text.primary' }}>
        Fonctionnalités à Venir
      </Typography>

      <Stack spacing={3}>
        {upcomingFeatures.map((feature, index) => (
          <Card key={index} sx={{ 
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3,
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ 
                  color: 'primary.main',
                  mt: 0.5,
                  '& svg': { fontSize: '2rem' }
                }}>
                  {feature.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Info Box */}
      <Box sx={{ 
        mt: 6, 
        p: 3, 
        backgroundColor: 'grey.50', 
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Typography variant="body1" color="text.secondary">
          Cette section permettra la gestion complète de votre équipe avec la possibilité 
          d'assigner des services, définir les horaires et suivre les performances.
        </Typography>
      </Box>
    </Container>
  );
}

export default EmployeesManagement; 