import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  Person,
  Phone,
  Event,
  Schedule,
  Work,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Done,
} from '@mui/icons-material';
import type { Reservation } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReservationDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

/**
 * ReservationDetailsDialog Component
 * 
 * Dialog for viewing detailed reservation information
 * Shows client, service, employee, and timing details
 */
const ReservationDetailsDialog: React.FC<ReservationDetailsDialogProps> = ({
  open,
  onClose,
  reservation,
}) => {
  if (!reservation) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle color="success" />;
      case 'REQUESTED': return <Pending color="warning" />;
      case 'CANCELLED': return <Cancel color="error" />;
      case 'COMPLETED': return <Done color="primary" />;
      default: return <Event />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'REQUESTED': return 'warning';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'primary';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'manual' ? 'secondary' : 'info';
  };

  const clientName = reservation.client?.full_name || reservation.client_full_name || 'Client inconnu';
  const clientPhone = reservation.client_phone || reservation.client?.phone || 'Non renseigné';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="reservation-details-dialog-title"
    >
      <DialogTitle id="reservation-details-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="span">
            Détails de la réservation #{reservation.id}
          </Typography>
          <Chip
            label={reservation.status}
            size="small"
            color={getStatusColor(reservation.status) as any}
            icon={getStatusIcon(reservation.status)}
            variant="outlined"
          />
          <Chip
            label={reservation.type === 'manual' ? 'Manuelle' : 'En ligne'}
            size="small"
            color={getTypeColor(reservation.type) as any}
            variant="filled"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Client Information */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              Informations client
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ pl: 2 }}>
              <ListItem sx={{ pl: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={clientName}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Phone fontSize="small" />
                      <Typography variant="body2">{clientPhone}</Typography>
                    </Box>
                  }
                />
              </ListItem>
            </Box>
          </Box>

          {/* Service and Employee Information */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Service Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work color="primary" />
                Service
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {reservation.service?.name || 'Service inconnu'}
                </Typography>
                {reservation.service?.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {reservation.service.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Durée:</strong> {reservation.service?.duration_min || 0} min
                  </Typography>
                  <Typography variant="body2">
                    <strong>Prix:</strong> {reservation.service?.price_dhs || 0} DH
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Employee Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="primary" />
                Employé
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ pl: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {reservation.employee?.full_name || 'Employé inconnu'}
                </Typography>
                {reservation.employee?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{reservation.employee.phone}</Typography>
                  </Box>
                )}
                {reservation.employee?.note && (
                  <Typography variant="body2" color="text.secondary">
                    {reservation.employee.note}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Timing Information */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              Horaires
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pl: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Event fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Date:</strong> {format(new Date(reservation.start_at), 'dd MMMM yyyy', { locale: fr })}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2">
                  <strong>Heure:</strong> {format(new Date(reservation.start_at), 'HH:mm', { locale: fr })} - {format(new Date(reservation.end_at), 'HH:mm', { locale: fr })}
                </Typography>
              </Box>
              
              <Typography variant="body2">
                <strong>Créée le:</strong> {format(new Date(reservation.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              </Typography>
              
              <Typography variant="body2">
                <strong>Modifiée le:</strong> {format(new Date(reservation.updated_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationDetailsDialog; 