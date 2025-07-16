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
  BarChart,
  TrendingUp,
  Assessment,
  DateRange,
} from '@mui/icons-material';

/**
 * Reports Component
 * 
 * Admin page for viewing analytics and reports
 * Features to be implemented:
 * - Revenue reports and trends
 * - Employee performance analytics
 * - Service popularity metrics
 * - Customer retention analysis
 */
function Reports() {
  // Placeholder features list
  const upcomingFeatures = [
    { icon: <BarChart />, title: 'Rapports de Revenus', description: 'Analyser les revenus par période et service' },
    { icon: <TrendingUp />, title: 'Tendances', description: 'Visualiser les tendances de croissance' },
    { icon: <Assessment />, title: 'Performance', description: 'Évaluer les performances des employés' },
    { icon: <DateRange />, title: 'Rapports Personnalisés', description: 'Créer des rapports sur mesure par période' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Rapports & Analyses
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Analysez les performances de votre salon
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
          Cette section fournira des analyses détaillées avec des graphiques interactifs 
          pour vous aider à prendre des décisions éclairées pour votre business.
        </Typography>
      </Box>
    </Container>
  );
}

export default Reports; 