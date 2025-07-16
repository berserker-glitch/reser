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
  AddCircle,
  AttachMoney,
  AccessTime,
  Category,
} from '@mui/icons-material';

/**
 * ServicesManagement Component
 * 
 * Admin page for managing salon services
 * Features to be implemented:
 * - Add, edit, and remove services
 * - Set pricing and duration
 * - Categorize services
 * - Assign services to employees
 */
function ServicesManagement() {
  // Placeholder features list
  const upcomingFeatures = [
    { icon: <AddCircle />, title: 'Gestion des Services', description: 'Créer, modifier et supprimer les services' },
    { icon: <AttachMoney />, title: 'Tarification', description: 'Définir les prix et offres spéciales' },
    { icon: <AccessTime />, title: 'Durée des Services', description: 'Configurer la durée de chaque prestation' },
    { icon: <Category />, title: 'Catégories', description: 'Organiser les services par catégories' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Gestion des Services
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Gérez votre catalogue de prestations
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
          Cette section permettra la gestion complète de votre offre de services avec 
          la configuration des prix, durées et attribution aux employés qualifiés.
        </Typography>
      </Box>
    </Container>
  );
}

export default ServicesManagement; 