import { Box, Typography, Container, Grid, Paper, Chip } from '@mui/material';
import { 
  ContentCut, 
  Palette, 
  Spa, 
  AutoFixHigh 
} from '@mui/icons-material';

const ServicesPage = () => {
  const services = [
    {
      id: 1,
      name: 'Coupe Classique',
      description: 'Coupe et mise en forme personnalisée selon votre style',
      duration: '30 min',
      price: '150 DH',
      icon: <ContentCut />,
      category: 'Coupe'
    },
    {
      id: 2,
      name: 'Coloration',
      description: 'Coloration complète avec produits professionnels',
      duration: '90 min',
      price: '300 DH',
      icon: <Palette />,
      category: 'Coloration'
    },
    {
      id: 3,
      name: 'Soins Capillaires',
      description: 'Traitement nourrissant et réparateur pour vos cheveux',
      duration: '45 min',
      price: '200 DH',
      icon: <Spa />,
      category: 'Soins'
    },
    {
      id: 4,
      name: 'Styling & Brushing',
      description: 'Mise en forme et coiffage pour toute occasion',
      duration: '40 min',
      price: '120 DH',
      icon: <AutoFixHigh />,
      category: 'Styling'
    },
    {
      id: 5,
      name: 'Coupe + Coloration',
      description: 'Formule complète : coupe personnalisée + coloration',
      duration: '120 min',
      price: '400 DH',
      icon: <ContentCut />,
      category: 'Formule'
    },
    {
      id: 6,
      name: 'Mèches',
      description: 'Mèches subtiles ou marquées selon votre préférence',
      duration: '75 min',
      price: '250 DH',
      icon: <Palette />,
      category: 'Coloration'
    }
  ];

  const categories = ['Tous', 'Coupe', 'Coloration', 'Soins', 'Styling', 'Formule'];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        {/* Hero Section */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            py: 6,
          }}
        >
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              component="h1"
              textAlign="center"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Nos Services
            </Typography>
            <Typography
              variant="h6"
              textAlign="center"
              sx={{ opacity: 0.9, maxWidth: '600px', mx: 'auto' }}
            >
              Découvrez notre gamme complète de services beauté 
              réalisés par des professionnels expérimentés
            </Typography>
          </Container>
        </Box>

        {/* Services Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          {/* Category Filter */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  variant={category === 'Tous' ? 'filled' : 'outlined'}
                  color={category === 'Tous' ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Services Grid */}
          <Grid container spacing={4}>
            {services.map((service) => (
              <Grid item xs={12} md={6} lg={4} key={service.id}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        color: 'primary.main',
                        mr: 2,
                        fontSize: '2rem',
                      }}
                    >
                      {service.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {service.name}
                      </Typography>
                      <Chip
                        label={service.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    {service.description}
                  </Typography>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 'auto',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Durée : {service.duration}
                    </Typography>
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {service.price}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Call to Action */}
        <Box
          sx={{
            bgcolor: 'grey.50',
            py: 6,
          }}
        >
          <Container maxWidth="md">
            <Paper
              elevation={3}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ fontWeight: 'bold', mb: 3 }}
              >
                Prêt à prendre rendez-vous ?
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4 }}
              >
                Nos professionnels sont à votre disposition pour vous offrir 
                le meilleur service. Réservez dès maintenant !
              </Typography>
              <Typography
                variant="h6"
                color="primary"
                sx={{ fontWeight: 'bold' }}
              >
                📞 +212 5XX-XXXXXX
              </Typography>
            </Paper>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default ServicesPage; 