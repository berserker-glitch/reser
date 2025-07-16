import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
} from '@mui/material';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactElement;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  color = 'primary',
  icon,
  loading = false,
}) => {
  const theme = useTheme();

  const getColorValue = (colorName: string) => {
    switch (colorName) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, position: 'relative', pb: 2 }}>
        {/* Icon */}
        {icon && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: getColorValue(color),
              opacity: 0.8,
            }}
          >
            <Box sx={{ fontSize: '2rem' }}>{icon}</Box>
          </Box>
        )}

        {/* Title */}
        <Typography
          color="text.secondary"
          gutterBottom
          variant="overline"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          {title}
        </Typography>

        {/* Value */}
        <Typography
          variant="h3"
          component="div"
          sx={{
            fontWeight: 600,
            color: getColorValue(color),
            mb: 1,
            lineHeight: 1,
          }}
        >
          {loading ? (
            <CircularProgress size={32} sx={{ color: getColorValue(color) }} />
          ) : (
            value
          )}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>

        {/* Decorative accent */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${getColorValue(color)}40, ${getColorValue(color)}80)`,
            borderRadius: '0 0 8px 8px',
          }}
        />
      </CardContent>
    </Card>
  );
};

export default StatsCard; 