import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Fab,
} from '@mui/material';
import {
  Add,
  Search,
  Refresh,
  GridView,
  ViewList,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeCard, EmployeeDialog, EmployeeDetailsDialog } from '../../components/employees';
import type { Employee, EmployeeFormData, Service } from '../../types';

// Employee filters interface
interface EmployeeFilters {
  search?: string;
  sort_by?: 'full_name' | 'created_at' | 'phone';
  sort_direction?: 'asc' | 'desc';
}

/**
 * EmployeesManagement Component
 * 
 * Complete employee management system with CRUD operations
 * Features:
 * - Employee listing with search and filters
 * - Create, edit, delete employees
 * - Profile picture upload support
 * - Service assignment management
 * - Responsive design with grid/list view
 */
function EmployeesManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'full_name' | 'created_at' | 'phone'>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Dialog states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | undefined>();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [employeeForDetails, setEmployeeForDetails] = useState<Employee | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Query filters
  const filters: EmployeeFilters = useMemo(() => ({
    search: searchQuery || undefined,
    sort_by: sortBy,
    sort_direction: sortDirection,
  }), [searchQuery, sortBy, sortDirection]);

  // Data fetching
  const {
    data: allEmployees = [],
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Employee fetch error:', errorText);
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }
      const data = await response.json();
      console.log('Employee API response:', data);
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Get available services for assignment
  const {
    data: availableServices = [],
  } = useQuery({
    queryKey: ['services-for-assignment'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/services`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
  });

  // Filter and sort employees on the frontend
  const employees = useMemo(() => {
    // Ensure allEmployees is an array
    const employeesArray = Array.isArray(allEmployees) ? allEmployees : [];
    let filtered = employeesArray;

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((employee: Employee) =>
        employee.full_name.toLowerCase().includes(searchTerm) ||
        (employee.phone && employee.phone.toLowerCase().includes(searchTerm)) ||
        (employee.note && employee.note.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a: Employee, b: Employee) => {
      let aValue, bValue;
      
      switch (filters.sort_by) {
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'full_name':
        default:
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
      }

      if (aValue < bValue) return filters.sort_direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sort_direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allEmployees, filters]);

  // Mutations
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/employees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de l\'employé');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDialogOpen(false);
      setSelectedEmployee(undefined);
      showSnackbar('Employé créé avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la création de l\'employé',
        'error'
      );
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EmployeeFormData> }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la modification de l\'employé');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDialogOpen(false);
      setSelectedEmployee(undefined);
      showSnackbar('Employé modifié avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la modification de l\'employé',
        'error'
      );
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/admin/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('admin_token')}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression de l\'employé');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteDialogOpen(false);
      setEmployeeToDelete(undefined);
      showSnackbar('Employé supprimé avec succès', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.message || 'Erreur lors de la suppression de l\'employé',
        'error'
      );
    },
  });

  // Event handlers
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleCreateEmployee = () => {
    setSelectedEmployee(undefined);
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    console.log('Editing employee:', employee);
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    console.log('Deleting employee:', employee);
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEmployee = () => {
    if (employeeToDelete) {
      deleteEmployeeMutation.mutate(employeeToDelete.id);
    }
  };

  const handleDuplicateEmployee = (employee: Employee) => {
    console.log('Duplicating employee:', employee);
    // Create a duplicate with modified name
    const duplicateData: EmployeeFormData = {
      full_name: `${employee.full_name} (Copie)`,
      phone: employee.phone || '',
      note: employee.note || '',
      service_ids: employee.services?.map(s => s.id) || [],
    };
    
    createEmployeeMutation.mutate(duplicateData);
  };

  const handleManageEmployeeServices = (employee: Employee) => {
    console.log('Managing services for employee:', employee);
    // For now, show the edit dialog to manage services
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
    showSnackbar(`Modification des services pour ${employee.full_name}`, 'info');
  };

  const handleViewDetails = (employee: Employee) => {
    setEmployeeForDetails(employee);
    setDetailsDialogOpen(true);
  };

  const handleSubmitEmployee = (data: EmployeeFormData) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleRefresh = () => {
    refetchEmployees();
  };

  // Loading state
  const isLoading = createEmployeeMutation.isPending || updateEmployeeMutation.isPending || deleteEmployeeMutation.isPending;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Gestion des Employés
        </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Actualiser">
              <span>
                <IconButton onClick={handleRefresh} disabled={employeesLoading}>
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
            
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateEmployee}
                size="large"
              >
                Nouvel Employé
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Gérez votre équipe et leurs compétences
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2, 
        mb: 4,
        p: 3, 
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}>
        {/* Search */}
        <TextField
          placeholder="Rechercher un employé..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />

        {/* Sort Options */}
        <Box sx={{ display: 'flex', gap: 2, minWidth: { md: 400 } }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Trier par</InputLabel>
            <Select
              value={sortBy}
              label="Trier par"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="full_name">Nom</MenuItem>
              <MenuItem value="phone">Téléphone</MenuItem>
              <MenuItem value="created_at">Date de création</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Ordre</InputLabel>
            <Select
              value={sortDirection}
              label="Ordre"
              onChange={(e) => setSortDirection(e.target.value as any)}
            >
              <MenuItem value="asc">Croissant</MenuItem>
              <MenuItem value="desc">Décroissant</MenuItem>
            </Select>
          </FormControl>

          {/* View Toggle */}
          <Box sx={{ display: 'flex' }}>
            <IconButton
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridView />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ViewList />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Employees Grid */}
      {employeesLoading ? (
        <Typography>Chargement des employés...</Typography>
      ) : employeesError ? (
        <Alert severity="error">Erreur lors du chargement des employés</Alert>
      ) : employees.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun employé trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery ? 'Essayez de modifier vos critères de recherche.' : 'Commencez par ajouter votre premier employé.'}
          </Typography>
          {!searchQuery && (
            <Button variant="contained" startIcon={<Add />} onClick={handleCreateEmployee}>
              Ajouter un employé
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: viewMode === 'grid' 
            ? { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }
            : '1fr',
          gap: 3
        }}>
          {employees.map((employee: Employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
              onDuplicate={handleDuplicateEmployee}
              onViewDetails={handleViewDetails}
              onManageServices={handleManageEmployeeServices}
              showServices={true}
              showStatistics={true}
            />
          ))}
        </Box>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateEmployee}
        >
          <Add />
        </Fab>
      )}

      {/* Employee Dialog */}
      <EmployeeDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedEmployee(undefined);
        }}
        employee={selectedEmployee}
        onSubmit={handleSubmitEmployee}
        loading={isLoading}
        error={createEmployeeMutation.error?.message || updateEmployeeMutation.error?.message}
        availableServices={availableServices}
      />

      {/* Employee Details Dialog */}
      <EmployeeDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setEmployeeForDetails(null);
        }}
        employee={employeeForDetails}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer l'employé "{employeeToDelete?.full_name}" ? 
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button 
            onClick={confirmDeleteEmployee} 
            color="error" 
            variant="contained"
            disabled={deleteEmployeeMutation.isPending}
          >
            {deleteEmployeeMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default EmployeesManagement; 