import { Box, Typography, Button, Container, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  LoginOutlined, 
  ContentCut, 
  Schedule, 
  People, 
  Star 
} from '@mui/icons-material';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        {/* Hero Section */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            py: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h2"
                  component="h1"
                  gutterBottom
                  sx={{ fontWeight: 'bold', mb: 2 }}
                >
                  Salon Réservation
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ mb: 4, opacity: 0.9 }}
                >
                  Réservez votre rendez-vous en ligne facilement
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mb: 4, opacity: 0.8, maxWidth: '500px' }}
                >
                  Découvrez notre salon de coiffure moderne et réservez votre créneau 
                  idéal en quelques clics. Services professionnels, équipe expérimentée, 
                  ambiance chaleureuse.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Schedule />}
                    onClick={() => navigate('/services')}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                      py: 1.5,
                      px: 4,
                    }}
                  >
                    Réserver maintenant
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<LoginOutlined />}
                    onClick={() => navigate('/login')}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                      py: 1.5,
                      px: 4,
                    }}
                  >
                    Se connecter
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '300px',
                  }}
                >
                  <ContentCut
                    sx={{
                      fontSize: '12rem',
                      opacity: 0.3,
                      transform: 'rotate(15deg)',
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography
            variant="h4"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ mb: 6, fontWeight: 'bold' }}
          >
            Pourquoi choisir notre salon ?
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  borderRadius: 2,
                }}
              >
                <Schedule
                  color="primary"
                  sx={{ fontSize: '3rem', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Réservation en ligne
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Réservez votre rendez-vous 24h/24 et 7j/7 en quelques clics. 
                  Choisissez votre créneau idéal selon vos disponibilités.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  borderRadius: 2,
                }}
              >
                <People
                  color="primary"
                  sx={{ fontSize: '3rem', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Équipe professionnelle
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nos coiffeurs expérimentés vous offrent des services de qualité 
                  dans une atmosphère détendue et accueillante.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  borderRadius: 2,
                }}
              >
                <Star
                  color="primary"
                  sx={{ fontSize: '3rem', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Services variés
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Coupe, coloration, soins capillaires, styling... 
                  Découvrez notre gamme complète de services beauté.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* Call to Action Section */}
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
                Prêt à transformer votre look ?
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
              >
                Rejoignez des centaines de clients satisfaits et découvrez 
                l'expérience unique de notre salon. Réservez dès maintenant !
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Schedule />}
                onClick={() => navigate('/services')}
                sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
              >
                Réserver un rendez-vous
              </Button>
            </Paper>
          </Container>
        </Box>
      </Box>
    </Box>
  );
} 