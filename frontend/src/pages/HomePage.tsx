import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LoginOutlined } from '@mui/icons-material';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom color="primary">
            Salon Réservation
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Système de gestion pour votre salon de coiffure
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 300 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginOutlined />}
              onClick={() => navigate('/client/login')}
              sx={{ py: 1.5, px: 4 }}
            >
              Réserver un rendez-vous
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              sx={{ py: 1.5, px: 4 }}
            >
              Administration
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 