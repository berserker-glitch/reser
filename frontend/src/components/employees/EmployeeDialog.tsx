import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import EmployeeForm from './EmployeeForm';
import type { Employee, EmployeeFormData, Service } from '../../types';

interface EmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee; // For editing existing employee
  onSubmit: (data: EmployeeFormData) => void;
  loading?: boolean;
  error?: string;
  availableServices?: Service[];
}

/**
 * EmployeeDialog Component
 * 
 * A modal dialog that contains the EmployeeForm for creating and editing employees.
 * Features:
 * - Responsive design (fullscreen on mobile)
 * - Proper accessibility with dialog semantics
 * - Clean close handling
 * - Loading and error state management
 */
const EmployeeDialog: React.FC<EmployeeDialogProps> = ({
  open,
  onClose,
  employee,
  onSubmit,
  loading = false,
  error,
  availableServices = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = !!employee;

  const handleSubmit = (data: EmployeeFormData) => {
    onSubmit(data);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2,
        },
      }}
      // Prevent closing when loading
      disableEscapeKeyDown={loading}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        {isEditing ? 'Modifier l\'employé' : 'Nouvel employé'}
        
        <IconButton
          onClick={handleClose}
          disabled={loading}
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
        <EmployeeForm
          employee={employee}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
          error={error}
          availableServices={availableServices}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDialog; 