import React, { useState } from 'react';
import {
  Card,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
  Divider,
  alpha,
} from '@mui/material';
import {
  AccessTime,
  AttachMoney,
  MoreVert,
  Edit,
  Delete,
  FileCopy,
  Group,
  ExpandMore,
  ExpandLess,
  TrendingUp,
} from '@mui/icons-material';
import type { Service } from '../../types';

interface ServiceCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  onDuplicate?: (service: Service) => void;
  onViewDetails?: (service: Service) => void;
  onManageEmployees?: (service: Service) => void;
  showEmployees?: boolean;
  showStatistics?: boolean;
}

/**
 * ServiceCard Component
 * 
 * A comprehensive card component for displaying service information
 * Features:
 * - Service details (name, price, duration)
 * - Employee assignments
 * - Statistics (if available)
 * - Action menu with edit, delete, duplicate options
 * - Expandable content for detailed view
 * - Responsive design following Material-UI patterns
 */
const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
  onManageEmployees,
  showEmployees = true,
  showStatistics = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const menuOpen = Boolean(anchorEl);

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit?.(service);
    handleMenuClose();
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete?.(service);
    handleMenuClose();
  };

  const handleDuplicate = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDuplicate?.(service);
    handleMenuClose();
  };

  const handleViewDetails = () => {
    onViewDetails?.(service);
  };

  const handleManageEmployees = (event: React.MouseEvent) => {
    event.stopPropagation();
    onManageEmployees?.(service);
    handleMenuClose();
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Format price for display
  const formatPrice = (price: number): string => {
    const numericPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
    return `${numericPrice.toFixed(2)} DH`;
  };

  // Format duration for display
  const formatDurationText = (minutes: number): string => {
    if (minutes < 60) return 'Service rapide';
    if (minutes <= 120) return 'Service standard'; 
    return 'Service long';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          '& .service-card-actions': {
            opacity: 1,
          },
        },
        position: 'relative',
        overflow: 'visible',
      }}
      onClick={handleViewDetails}
    >
      {/* Card Header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              flex: 1,
              mr: 1,
              lineHeight: 1.3,
            }}
          >
            {service.name}
          </Typography>
          
          {/* Duration Info */}
          <Chip
            label={formatDurationText(service.duration_min)}
            color="default"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>

        {/* Price and Duration Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AttachMoney sx={{ fontSize: '1rem', color: 'success.main' }} />
            <Typography variant="body2" fontWeight={600} color="success.main">
              {formatPrice(service.price_dhs)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {formatDuration(service.duration_min)}
            </Typography>
          </Box>
        </Box>

        {/* Description */}
        {service.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4,
            }}
          >
            {service.description}
          </Typography>
        )}
      </Box>

      {/* Statistics Row */}
      {showStatistics && (service.reservations_count !== undefined || service.active_employees_count !== undefined) && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {service.active_employees_count !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Group sx={{ fontSize: '0.875rem', color: 'info.main' }} />
                <Typography variant="caption" color="info.main">
                  {service.active_employees_count} employé{service.active_employees_count !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
            
            {service.reservations_count !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: '0.875rem', color: 'secondary.main' }} />
                <Typography variant="caption" color="secondary.main">
                  {service.reservations_count} réservation{service.reservations_count !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Employee List (Expandable) */}
      {showEmployees && service.employees && service.employees.length > 0 && (
        <>
          <Box sx={{ px: 2, pb: 1 }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleExpandClick();
              }}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              sx={{ p: 0, minWidth: 'auto', color: 'text.secondary' }}
            >
              <Typography variant="caption">
                Voir les employés ({service.employees.length})
              </Typography>
            </Button>
          </Box>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ px: 2, pb: 1 }}>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {service.employees.map((employee) => (
                  <Chip
                    key={employee.id}
                    label={employee.full_name}
                    size="small"
                    variant="outlined"
                    avatar={
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                        {employee.full_name.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                  />
                ))}
              </Box>
            </Box>
          </Collapse>
        </>
      )}

      {/* Card Actions */}
      <CardActions
        className="service-card-actions"
        sx={{
          mt: 'auto',
          p: 2,
          pt: 1,
          opacity: 0.7,
          transition: 'opacity 0.3s ease-in-out',
          justifyContent: 'flex-end',
        }}
      >
        <Tooltip title="Plus d'actions">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e);
            }}
            sx={{
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <MoreVert />
          </IconButton>
        </Tooltip>
      </CardActions>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
          },
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 1, fontSize: '1rem' }} />
            Modifier
          </MenuItem>
        )}
        
        {onManageEmployees && (
          <MenuItem onClick={handleManageEmployees}>
            <Group sx={{ mr: 1, fontSize: '1rem' }} />
            Gérer employés
          </MenuItem>
        )}
        
        {onDuplicate && (
          <MenuItem onClick={handleDuplicate}>
            <FileCopy sx={{ mr: 1, fontSize: '1rem' }} />
            Dupliquer
          </MenuItem>
        )}
        
        {onDelete && [
          <Divider key="divider" />,
          <MenuItem key="delete" onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 1, fontSize: '1rem' }} />
            Supprimer
          </MenuItem>
        ]}
      </Menu>
    </Card>
  );
};

export default ServiceCard; 