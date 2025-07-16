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
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginOutlined />}
            onClick={() => navigate('/login')}
            sx={{ py: 1.5, px: 4 }}
          >
            Se connecter
          </Button>
        </Paper>
      </Box>
    </Container>
  );
} 