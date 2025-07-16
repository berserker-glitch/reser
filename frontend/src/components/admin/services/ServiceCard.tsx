import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccessTime,
  AttachMoney,
  Business,
  MoreVert,
  Star,
} from '@mui/icons-material';
import type { Service } from '../../../types';

interface ServiceCardProps {
  service: Service;
  onClick: (service: Service) => void;
}

/**
 * ServiceCard Component
 * 
 * Displays individual service information in a card format:
 * - Service name and description
 * - Price and duration
 * - Hover effects for better UX
 * - Click handler to open details
 */
export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  const handleClick = () => {
    onClick(service);
  };

  // Generate a color based on service name for visual variety
  const getServiceColor = (name: string): string => {
    const colors = [
      'primary.main',
      'secondary.main',
      'success.main',
      'info.main',
      'warning.main',
      'error.main',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getServiceBgColor = (name: string): string => {
    const colors = [
      'primary.light',
      'secondary.light',
      'success.light',
      'info.light',
      'warning.light',
      'error.light',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const serviceColor = getServiceColor(service.name);
  const serviceBgColor = getServiceBgColor(service.name);

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 6,
          '& .service-card-overlay': {
            opacity: 1,
          },
        },
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ pb: 2 }}>
        {/* Header with Avatar and More Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: serviceBgColor,
              color: serviceColor,
              width: 48,
              height: 48,
            }}
          >
            <Business />
          </Avatar>
          <Tooltip title="Plus d'options">
            <IconButton
              size="small"
              sx={{ 
                opacity: 0.7,
                '&:hover': { opacity: 1 }
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Handle more options here in the future
              }}
            >
              <MoreVert />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Service Name */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '3.2em',
            lineHeight: '1.6em',
          }}
        >
          {service.name}
        </Typography>

        {/* Service Description */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 3,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '4.5em',
            lineHeight: '1.5em',
          }}
        >
          {service.description || 'Aucune description disponible'}
        </Typography>

        {/* Price and Duration */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <AttachMoney sx={{ fontSize: '1.2rem', color: 'success.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              {service.price_dhs} DHS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <AccessTime sx={{ fontSize: '1.2rem', color: 'info.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.main' }}>
              {service.duration_min} min
            </Typography>
          </Box>
        </Box>

        {/* Service Status/Quality Indicator */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label="Actif"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Star sx={{ fontSize: '1rem', color: 'warning.main' }} />
            <Typography variant="caption" color="text.secondary">
              Service populaire
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Hover Overlay */}
      <Box
        className="service-card-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(24, 96, 255, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease-in-out',
          borderRadius: 1,
          pointerEvents: 'none',
        }}
      />
    </Card>
  );
}; 