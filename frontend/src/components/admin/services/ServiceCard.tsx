import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccessTime,
  AttachMoney,
  Business,
  MoreVert,
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

  return (
    <Card
      elevation={1}
      sx={{
        height: '100%',
        cursor: 'pointer',
        border: '1px solid #f0f0f0',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 2, pb: 2 }}>
        {/* Header with Icon and More Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ 
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Business />
          </Box>
          <Tooltip title="Plus d'options">
            <IconButton
              size="small"
              sx={{ 
                opacity: 0.5,
                '&:hover': { opacity: 1 }
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Handle more options here in the future
              }}
            >
              <MoreVert sx={{ color: 'secondary.main' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Service Name */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            mb: 1,
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '3rem',
            lineHeight: '1.5em',
          }}
        >
          {service.name}
        </Typography>

        {/* Service Description */}
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '2.5em',
            lineHeight: '1.25em',
          }}
        >
          {service.description || 'Aucune description disponible'}
        </Typography>

        {/* Price and Duration */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <AttachMoney sx={{ fontSize: '1.1rem', color: 'secondary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {service.price_dhs} DHS
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
            <AccessTime sx={{ fontSize: '1.1rem', color: 'secondary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {service.duration_min} min
            </Typography>
          </Box>
        </Box>

        {/* Service Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ 
            backgroundColor: '#f5f5f5', 
            color: 'text.secondary', 
            px: 1, 
            py: 0.25, 
            borderRadius: 0.5,
            fontWeight: 500 
          }}>
            Actif
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Service disponible
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}; 