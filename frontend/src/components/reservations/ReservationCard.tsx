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
  Phone,
  Schedule,
  MoreVert,
  Edit,
  Delete,
  FileCopy,
  Work,
  ExpandMore,
  ExpandLess,
  Person,
  Event,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Star,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Reservation } from '../../types';

interface ReservationCardProps {
  reservation: Reservation;
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (reservation: Reservation) => void;
  onDuplicate?: (reservation: Reservation) => void;
  onViewDetails?: (reservation: Reservation) => void;
  onChangeStatus?: (reservation: Reservation, newStatus: string) => void;
  showDetails?: boolean;
  showStatistics?: boolean;
}

/**
 * ReservationCard Component
 * 
 * A comprehensive card component for displaying reservation information
 * Features:
 * - Reservation details (client, service, employee, time)
 * - Status management
 * - Type indicator (online/manual)
 * - Action menu
 */
const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
  onChangeStatus,
  showDetails = false,
  showStatistics = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action: string) => {
    handleClose();
    
    switch (action) {
      case 'edit':
        onEdit?.(reservation);
        break;
      case 'delete':
        onDelete?.(reservation);
        break;
      case 'duplicate':
        onDuplicate?.(reservation);
        break;
      case 'details':
        onViewDetails?.(reservation);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'REQUESTED': return 'warning';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle />;
      case 'REQUESTED': return <Pending />;
      case 'CANCELLED': return <Cancel />;
      case 'COMPLETED': return <Star />;
      default: return <Schedule />;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'manual' ? 'secondary' : 'primary';
  };

  const getClientName = () => {
    if (reservation.type === 'manual' && reservation.client_full_name) {
      return reservation.client_full_name;
    }
    return reservation.client?.full_name || 'Client inconnu';
  };

  const getClientPhone = () => {
    if (reservation.type === 'manual' && reservation.client_phone) {
      return reservation.client_phone;
    }
    return reservation.client?.phone || 'Non renseigné';
  };

  return (
    <Card
      sx={{
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
        cursor: 'pointer',
        borderLeft: `4px solid`,
        borderLeftColor: getStatusColor(reservation.status) + '.main',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <Box sx={{ p: 3 }}>
        {/* Header with client info and actions */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: getStatusColor(reservation.status) + '.main',
                fontSize: '1.2rem',
              }}
            >
              {getClientName().charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {getClientName()}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {getClientPhone()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={getStatusIcon(reservation.status)}
                  label={reservation.status}
                  color={getStatusColor(reservation.status) as any}
                  size="small"
                />
                <Chip
                  label={reservation.type === 'manual' ? 'Manuelle' : 'En ligne'}
                  color={getTypeColor(reservation.type) as any}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Plus d'actions">
              <IconButton
                onClick={handleClick}
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Reservation details */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Service
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reservation.service?.name || 'Service inconnu'}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Employé
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reservation.employee?.full_name || 'Employé inconnu'}
            </Typography>
          </Box>
        </Box>

        {/* Date and time */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {format(new Date(reservation.start_at), 'EEEE dd MMMM yyyy', { locale: fr })} à {format(new Date(reservation.start_at), 'HH:mm')}
          </Typography>
        </Box>

        {/* Expandable details */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Heure de fin
              </Typography>
              <Typography variant="body2">
                {format(new Date(reservation.end_at), 'HH:mm')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Durée
              </Typography>
              <Typography variant="body2">
                {reservation.service?.duration_min || 30} minutes
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Prix
              </Typography>
              <Typography variant="body2">
                {reservation.service?.price_dhs || 0} DH
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Créé le
              </Typography>
              <Typography variant="body2">
                {format(new Date(reservation.created_at), 'dd/MM/yyyy')}
              </Typography>
            </Box>
          </Box>

          {showStatistics && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                ID: #{reservation.id}
              </Typography>
            </>
          )}
        </Collapse>

        {/* Expand/Collapse indicator */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <IconButton size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* Action Menu */}
      <Menu
        id="reservation-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuAction('details')}>
          <Event sx={{ mr: 1, fontSize: 20 }} />
          Voir détails
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Modifier
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('duplicate')}>
          <FileCopy sx={{ mr: 1, fontSize: 20 }} />
          Dupliquer
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1, fontSize: 20 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default ReservationCard; 