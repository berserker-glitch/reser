import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
} from '@mui/material';
import {
  Close,
  Person,
  Work,
  Add,
  Remove,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Service, Employee } from '../../types';

interface ServiceEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  service: Service | null;
}

/**
 * ServiceEmployeeDialog Component
 * 
 * Manages employee assignments for a specific service
 * Features:
 * - View currently assigned employees
 * - Add/remove employee assignments
 * - Real-time updates
 */
const ServiceEmployeeDialog: React.FC<ServiceEmployeeDialogProps> = ({
  open,
  onClose,
  service,
}) => {
  const queryClient = useQueryClient();
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch all employees
  const { data: allEmployees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      // Handle Laravel pagination structure
      if (data?.data?.data) {
        return data.data.data; // Laravel pagination: { data: { data: [...], meta: {...} } }
      } else if (data?.data) {
        return Array.isArray(data.data) ? data.data : []; // Direct data array
      } else if (Array.isArray(data)) {
        return data; // Direct array
      }
      return [];
    },
    enabled: open,
  });

  // Set initial selected employees when service changes
  useEffect(() => {
    if (service?.employees) {
      setSelectedEmployees(service.employees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  }, [service]);

  // Mutation to update service employee assignments
  const updateAssignmentsMutation = useMutation({
    mutationFn: async (employeeIds: number[]) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/services/${service!.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: service!.name,
          description: service!.description,
          duration_min: service!.duration_min,
          price_dhs: service!.price_dhs,
          employee_ids: employeeIds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update employee assignments');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setError('');
      onClose();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update employee assignments');
    },
  });

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSave = () => {
    updateAssignmentsMutation.mutate(selectedEmployees);
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!service) return null;

  const isLoading = employeesLoading || updateAssignmentsMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
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
          <Work sx={{ color: 'primary.main' }} />
          <Box>
            <Typography variant="h6">
              Gérer les employés
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {service.name}
            </Typography>
          </Box>
        </Box>
        
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Sélectionnez les employés qui peuvent effectuer ce service :
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {allEmployees.map((employee: Employee) => (
              <ListItem
                key={employee.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={employee.profile_picture || undefined}
                    sx={{
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40,
                    }}
                  >
                    {!employee.profile_picture && getInitials(employee.full_name)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={employee.full_name}
                  secondary={
                    <Box>
                      {employee.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {employee.phone}
                        </Typography>
                      )}
                      {employee.services && employee.services.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {employee.services.length} service{employee.services.length !== 1 ? 's' : ''} assigné{employee.services.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Checkbox
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={() => handleEmployeeToggle(employee.id)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {allEmployees.length === 0 && !isLoading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Aucun employé disponible
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Créez d'abord des employés pour les assigner à ce service
            </Typography>
          </Box>
        )}

        {selectedEmployees.length > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Employés sélectionnés ({selectedEmployees.length}) :
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selectedEmployees.map(employeeId => {
                const employee = allEmployees.find((emp: Employee) => emp.id === employeeId);
                return employee ? (
                  <Chip
                    key={employeeId}
                    label={employee.full_name}
                    size="small"
                    variant="outlined"
                    onDelete={() => handleEmployeeToggle(employeeId)}
                  />
                ) : null;
              })}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <Work />}
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceEmployeeDialog; 