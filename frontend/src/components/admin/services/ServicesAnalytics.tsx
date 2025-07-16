import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Business,
  AttachMoney,
  AccessTime,
  TrendingUp,
} from '@mui/icons-material';

interface ServiceStatistics {
  total_services: number;
  average_price: number;
  average_duration: number;
  most_popular: Array<{
    id: number;
    name: string;
    price_dhs: number;
    reservations_count: number;
  }>;
  price_range: {
    min: number;
    max: number;
  };
  duration_range: {
    min: number;
    max: number;
  };
}

interface ReservationAnalytics {
  total_reservations: number;
  total_revenue: number;
  popular_services: Array<{
    service_name: string;
    reservation_count: number;
    revenue: number;
  }>;
}

interface ServicesAnalyticsProps {
  statistics: ServiceStatistics | null;
  reservationAnalytics: ReservationAnalytics | null;
}

/**
 * ServicesAnalytics Component
 * 
 * Displays key analytics and metrics for the services:
 * - Total services count
 * - Average price and duration
 * - Most popular services from real data
 * - Revenue and reservation analytics
 */
export const ServicesAnalytics: React.FC<ServicesAnalyticsProps> = ({ 
  statistics, 
  reservationAnalytics 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  if (!statistics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Analytics cards data
  const analyticsCards = [
    {
      title: 'Total Services',
      value: statistics.total_services,
      icon: <Business sx={{ color: 'secondary.main' }} />,
    },
    {
      title: 'Prix Moyen',
      value: `${statistics.average_price?.toFixed(0) || 0} DHS`,
      icon: <AttachMoney sx={{ color: 'secondary.main' }} />,
    },
    {
      title: 'Durée Moyenne',
      value: `${statistics.average_duration?.toFixed(0) || 0} min`,
      icon: <AccessTime sx={{ color: 'secondary.main' }} />,
    },
    {
      title: 'Revenus Totaux',
      value: `${reservationAnalytics?.total_revenue?.toFixed(0) || 0} DHS`,
      icon: <TrendingUp sx={{ color: 'secondary.main' }} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
        Aperçu des Services
      </Typography>

      {/* Main Analytics Cards */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 1.5,
          mb: 2,
          flexWrap: isTablet ? 'wrap' : 'nowrap',
        }}
      >
        {analyticsCards.map((card, index) => (
          <Box
            key={index}
            sx={{
              flex: isMobile ? 'none' : '1',
              minWidth: isMobile ? '100%' : isTablet ? '45%' : '200px',
            }}
          >
            <Card
              elevation={1}
              sx={{
                height: '100%',
                border: '1px solid #f0f0f0',
                transition: 'box-shadow 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {card.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {card.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Popular Services from Real Data */}
      {(reservationAnalytics?.popular_services && reservationAnalytics.popular_services.length > 0) && (
        <Card elevation={1} sx={{ border: '1px solid #f0f0f0', mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              Services les Plus Réservés
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 1.5,
                flexWrap: 'wrap',
              }}
            >
              {reservationAnalytics.popular_services.slice(0, 3).map((service, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: isMobile ? 'none' : '1',
                    minWidth: isMobile ? '100%' : '250px',
                  }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      backgroundColor: '#fafafa',
                      transition: 'background-color 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'text.primary' }}>
                        {service.service_name}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        backgroundColor: 'primary.main', 
                        color: 'white', 
                        px: 1, 
                        py: 0.25, 
                        borderRadius: 1,
                        fontWeight: 500 
                      }}>
                        #{index + 1}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {service.reservation_count} réservations
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {service.revenue} DHS
                      </Typography>
                    </Box>
                  </Card>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Card elevation={1} sx={{ height: '100%', border: '1px solid #f0f0f0' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Gamme de Durée
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {statistics.duration_range?.min || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Min (min)
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, height: 3, bgcolor: '#e0e0e0', borderRadius: 1.5, mx: 1 }}>
                  <Box sx={{ height: '100%', bgcolor: '#666', borderRadius: 1.5, width: '100%' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {statistics.duration_range?.max || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Max (min)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card elevation={1} sx={{ height: '100%', border: '1px solid #f0f0f0' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Fourchette de Prix
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {statistics.price_range?.min || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Min (DHS)
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, height: 3, bgcolor: '#e0e0e0', borderRadius: 1.5, mx: 1 }}>
                  <Box sx={{ height: '100%', bgcolor: '#666', borderRadius: 1.5, width: '100%' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {statistics.price_range?.max || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Max (DHS)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}; 