import React from 'react';
import { ListItemButton, Tooltip, Box } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NavItem } from '../../store/navigationStore';
import { getIconElement } from '../../store/navigationStore';

interface DraggableNavItemProps {
  item: NavItem;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

/**
 * DraggableNavItem Component
 * 
 * A draggable navigation item that:
 * - Maintains grid position (8px gaps)
 * - Shows visual feedback during drag
 * - Includes hover tooltips for accessibility
 * - Maintains Material-UI design consistency
 */
const DraggableNavItem: React.FC<DraggableNavItemProps> = ({
  item,
  isSelected,
  onClick,
  index,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        // Grid system - maintain consistent spacing
        mb: 1, // 8px bottom margin for grid spacing
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
      {...attributes}
      {...listeners}
    >
      <Tooltip title={item.label} placement="right" arrow>
        <ListItemButton
          selected={isSelected}
          onClick={onClick}
          sx={{
            minHeight: 48, // Consistent height for grid
            justifyContent: 'center',
            px: 1,
            borderRadius: 1,
            position: 'relative',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '& .MuiSvgIcon-root': {
                color: 'white',
              },
            },
            '&:hover': {
              bgcolor: isSelected ? 'primary.dark' : 'grey.100',
            },
            // Drag indicator dots
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 4,
              height: 16,
              background: `
                radial-gradient(circle, currentColor 1px, transparent 1px),
                radial-gradient(circle, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '2px 4px',
              backgroundPosition: '0 0, 0 2px',
              backgroundRepeat: 'repeat-y',
              opacity: 0.3,
              transition: 'opacity 0.2s ease-in-out',
            },
            '&:hover::before': {
              opacity: 0.6,
            },
          }}
        >
          {/* Render the icon with proper sizing */}
          <Box sx={{ display: 'flex', fontSize: 20 }}>
            {getIconElement(item.iconName)}
          </Box>
        </ListItemButton>
      </Tooltip>
    </Box>
  );
};

export default DraggableNavItem; 