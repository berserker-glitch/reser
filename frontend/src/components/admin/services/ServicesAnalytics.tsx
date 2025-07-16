import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Business,
  AttachMoney,
  AccessTime,
  TrendingUp,
  Star,
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

interface ServicesAnalyticsProps {
  statistics: ServiceStatistics | null;
}

/**
 * ServicesAnalytics Component
 * 
 * Displays key analytics and metrics for the services:
 * - Total services count
 * - Average price and duration
 * - Most popular services
 * - Price and duration ranges
 */
export const ServicesAnalytics: React.FC<ServicesAnalyticsProps> = ({ statistics }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  if (!statistics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Analytics cards data
  const analyticsCards = [
    {
      title: 'Total Services',
      value: statistics.total_services,
      icon: <Business />,
      color: 'primary.main',
      bgColor: 'primary.light',
    },
    {
      title: 'Prix Moyen',
      value: `${statistics.average_price?.toFixed(0) || 0} DHS`,
      icon: <AttachMoney />,
      color: 'success.main',
      bgColor: 'success.light',
    },
    {
      title: 'Durée Moyenne',
      value: `${statistics.average_duration?.toFixed(0) || 0} min`,
      icon: <AccessTime />,
      color: 'info.main',
      bgColor: 'info.light',
    },
    {
      title: 'Gamme de Prix',
      value: `${statistics.price_range?.min || 0} - ${statistics.price_range?.max || 0} DHS`,
      icon: <TrendingUp />,
      color: 'warning.main',
      bgColor: 'warning.light',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Aperçu des Services
      </Typography>

      {/* Main Analytics Cards */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 3,
          mb: 4,
          flexWrap: isTablet ? 'wrap' : 'nowrap',
        }}
      >
        {analyticsCards.map((card, index) => (
          <Box
            key={index}
            sx={{
              flex: isMobile ? 'none' : '1',
              minWidth: isMobile ? '100%' : isTablet ? '45%' : '220px',
            }}
          >
            <Card
              elevation={2}
              sx={{
                height: '100%',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: card.bgColor,
                      color: card.color,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: card.color }}>
                      {card.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Most Popular Services */}
      {statistics.most_popular && statistics.most_popular.length > 0 && (
        <Card elevation={2} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                <Star />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Services les Plus Populaires
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {statistics.most_popular.slice(0, 3).map((service, index) => (
                <Box
                  key={service.id}
                  sx={{
                    flex: isMobile ? 'none' : '1',
                    minWidth: isMobile ? '100%' : '280px',
                  }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {service.name}
                      </Typography>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {service.price_dhs} DHS
                      </Typography>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {service.reservations_count} réservations
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
          gap: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Gamme de Durée
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {statistics.duration_range?.min || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Min (minutes)
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, height: 4, bgcolor: 'grey.300', borderRadius: 2, mx: 2 }}>
                  <Box sx={{ height: '100%', bgcolor: 'info.main', borderRadius: 2, width: '100%' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {statistics.duration_range?.max || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Max (minutes)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Fourchette de Prix
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {statistics.price_range?.min || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Min (DHS)
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, height: 4, bgcolor: 'grey.300', borderRadius: 2, mx: 2 }}>
                  <Box sx={{ height: '100%', bgcolor: 'success.main', borderRadius: 2, width: '100%' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {statistics.price_range?.max || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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