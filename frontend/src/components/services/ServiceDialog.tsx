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
import ServiceForm from './ServiceForm';
import type { Service, ServiceFormData } from '../../types';

interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  service?: Service; // For editing existing service
  onSubmit: (data: ServiceFormData) => void;
  loading?: boolean;
  error?: string;
}

/**
 * ServiceDialog Component
 * 
 * A modal dialog that contains the ServiceForm for creating and editing services.
 * Features:
 * - Responsive design (fullscreen on mobile)
 * - Proper accessibility with dialog semantics
 * - Clean close handling
 * - Loading and error state management
 */
const ServiceDialog: React.FC<ServiceDialogProps> = ({
  open,
  onClose,
  service,
  onSubmit,
  loading = false,
  error,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = !!service;

  const handleSubmit = (data: ServiceFormData) => {
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
        {isEditing ? 'Modifier le service' : 'Nouveau service'}
        
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
        <ServiceForm
          service={service}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog; 