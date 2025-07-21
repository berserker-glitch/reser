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
  ListItemText,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Close,
  Phone,
  Work,
  Person,
  CalendarToday,
  Badge,
  Notes,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Employee } from '../../types';

interface EmployeeDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

/**
 * EmployeeDetailsDialog Component
 * 
 * Shows comprehensive details about an employee including:
 * - Basic information (name, phone, profile picture)
 * - Assigned services
 * - Notes and additional info
 * - Creation date
 */
const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({
  open,
  onClose,
  employee,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!employee) {
    return null;
  }

  // Format creation date
  const formatCreationDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return 'Date non disponible';
    }
  };

  // Get employee initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={employee.profile_picture}
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              fontSize: '1.1rem',
              fontWeight: 600,
            }}
          >
            {!employee.profile_picture && getInitials(employee.full_name)}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {employee.full_name}
          </Typography>
        </Box>
        
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

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Basic Information */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Informations personnelles
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                {employee.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ color: 'info.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Téléphone</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {employee.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge sx={{ color: 'secondary.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Identifiant</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Employé #{employee.id}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <CalendarToday sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                <Typography variant="body2" color="text.secondary">
                  Embauché le {formatCreationDate(employee.created_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Notes Section */}
          {employee.note && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  <Notes sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Notes et spécialités
                </Typography>
                <Typography variant="body1">
                  {employee.note}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Assigned Services */}
          {employee.services && employee.services.length > 0 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  Services assignés ({employee.services.length})
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {employee.services.map((service) => (
                    <Chip
                      key={service.id}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>{service.name}</span>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            ({service.duration_min}min - {service.price_dhs}DH)
                          </Typography>
                        </Box>
                      }
                      variant="outlined"
                      sx={{
                        '& .MuiChip-label': {
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* No services assigned */}
          {(!employee.services || employee.services.length === 0) && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                  Services assignés
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Aucun service n'est encore assigné à cet employé.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Statistics/Performance - Placeholder for future */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                Statistiques de performance
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Fonctionnalité en cours de développement - statistiques détaillées bientôt disponibles.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDetailsDialog; 