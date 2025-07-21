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
  Email,
  MoreVert,
  Edit,
  Delete,
  FileCopy,
  Work,
  ExpandMore,
  ExpandLess,
  Person,
  Badge,
} from '@mui/icons-material';
import type { Employee } from '../../types';

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onDuplicate?: (employee: Employee) => void;
  onViewDetails?: (employee: Employee) => void;
  onManageServices?: (employee: Employee) => void;
  showServices?: boolean;
  showStatistics?: boolean;
}

/**
 * EmployeeCard Component
 * 
 * A comprehensive card component for displaying employee information
 * Features:
 * - Employee details (name, phone, profile picture)
 * - Service assignments
 * - Statistics (if available)
 * - Action menu with edit, delete, duplicate options
 * - Expandable content for detailed view
 * - Profile picture display
 */
const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
  onManageServices,
  showServices = true,
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
    console.log('Edit employee:', employee.full_name);
    onEdit?.(employee);
    handleMenuClose();
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Delete employee:', employee.full_name);
    onDelete?.(employee);
    handleMenuClose();
  };

  const handleDuplicate = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Duplicate employee:', employee.full_name);
    onDuplicate?.(employee);
    handleMenuClose();
  };

  const handleViewDetails = () => {
    console.log('View details for employee:', employee.full_name);
    onViewDetails?.(employee);
  };

  const handleManageServices = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Manage services for employee:', employee.full_name);
    onManageServices?.(employee);
    handleMenuClose();
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
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
          '& .employee-card-actions': {
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          {/* Profile Picture */}
          <Avatar
            src={employee.profile_picture}
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              fontSize: '1.2rem',
              fontWeight: 600,
            }}
          >
            {!employee.profile_picture && getInitials(employee.full_name)}
          </Avatar>

          {/* Employee Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {employee.full_name}
            </Typography>
            
            {employee.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Phone sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {employee.phone}
                </Typography>
              </Box>
            )}

            {/* Employee ID Badge */}
            <Chip
              label={`ID: ${employee.id}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
        </Box>

        {/* Note/Description */}
        {employee.note && (
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
              mb: 1,
            }}
          >
            {employee.note}
          </Typography>
        )}
      </Box>

      {/* Statistics Row */}
      {showStatistics && employee.services && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Work sx={{ fontSize: '0.875rem', color: 'info.main' }} />
              <Typography variant="caption" color="info.main">
                {employee.services.length} service{employee.services.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Badge sx={{ fontSize: '0.875rem', color: 'secondary.main' }} />
              <Typography variant="caption" color="secondary.main">
                Employé #{employee.id}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Services List (Expandable) */}
      {showServices && employee.services && employee.services.length > 0 && (
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
                Voir les services ({employee.services.length})
              </Typography>
            </Button>
          </Box>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ px: 2, pb: 1 }}>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {employee.services.map((service) => (
                  <Chip
                    key={service.id}
                    label={service.name}
                    size="small"
                    variant="outlined"
                    sx={{
                      '& .MuiChip-label': {
                        fontSize: '0.75rem',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Collapse>
        </>
      )}

      {/* Card Actions */}
      <CardActions
        className="employee-card-actions"
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
        
        {onManageServices && (
          <MenuItem onClick={handleManageServices}>
            <Work sx={{ mr: 1, fontSize: '1rem' }} />
            Gérer services
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

export default EmployeeCard; 