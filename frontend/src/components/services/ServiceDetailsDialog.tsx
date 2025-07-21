import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,

  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close,
  AccessTime,
  AttachMoney,
  Group,
  TrendingUp,
  Person,
  CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Service } from '../../types';

interface ServiceDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  service: Service | null;
}

/**
 * ServiceDetailsDialog Component
 * 
 * Shows comprehensive details about a service including:
 * - Basic information (name, description, price, duration)
 * - Assigned employees
 * - Statistics if available
 * - Creation date
 */
const ServiceDetailsDialog: React.FC<ServiceDetailsDialogProps> = ({
  open,
  onClose,
  service,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!service) {
    return null;
  }

  // Format price for display
  const formatPrice = (price: number): string => {
    const numericPrice = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
    return `${numericPrice.toFixed(2)} DH`;
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

  // Format creation date
  const formatCreationDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return 'Date non disponible';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {service.name}
        </Typography>
        
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'grey.500',
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Basic Information */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Informations générales
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ color: 'success.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Prix</Typography>
                    <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {formatPrice(service.price_dhs)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime sx={{ color: 'info.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Durée</Typography>
                    <Typography variant="h6" sx={{ color: 'info.main', fontWeight: 600 }}>
                      {formatDuration(service.duration_min)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {service.description && (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>
                </>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                <Typography variant="body2" color="text.secondary">
                  Créé le {formatCreationDate(service.created_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Statistics */}
          {(service.reservations_count !== undefined || service.active_employees_count !== undefined) && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  Statistiques
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  {service.active_employees_count !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group sx={{ color: 'info.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Employés assignés</Typography>
                        <Typography variant="h6" sx={{ color: 'info.main', fontWeight: 600 }}>
                          {service.active_employees_count}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {service.reservations_count !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: 'secondary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total réservations</Typography>
                        <Typography variant="h6" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                          {service.reservations_count}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Assigned Employees */}
          {service.employees && service.employees.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  Employés qualifiés ({service.employees.length})
                </Typography>
                
                <List dense>
                  {service.employees.map((employee, index) => (
                    <React.Fragment key={employee.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={employee.full_name}
                          secondary={employee.phone ? `Tél: ${employee.phone}` : 'Téléphone non renseigné'}
                        />
                      </ListItem>
                                             {index < (service.employees?.length || 0) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* No employees assigned */}
          {(!service.employees || service.employees.length === 0) && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  Employés qualifiés
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Aucun employé n'est encore assigné à ce service.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailsDialog; 