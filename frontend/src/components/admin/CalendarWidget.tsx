import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Event as EventIcon,
} from '@mui/icons-material';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const CalendarWidget: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <Card>
      <CardHeader
        title="Calendrier"
        subtitle={format(currentDate, 'MMMM yyyy', { locale: fr })}
        action={
          <Box>
            <IconButton size="small" onClick={handlePrevMonth}>
              <ChevronLeft />
            </IconButton>
            <IconButton size="small" onClick={handleNextMonth}>
              <ChevronRight />
            </IconButton>
          </Box>
        }
        avatar={<EventIcon color="primary" />}
      />
      <CardContent sx={{ pt: 0 }}>
        {/* Simple month display */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1,
            mb: 2,
          }}
        >
          {/* Week days header */}
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
            <Box key={day} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {day}
              </Typography>
            </Box>
          ))}

          {/* Days - simplified for demo */}
          {Array.from({ length: 35 }, (_, i) => {
            const dayNumber = i < 5 ? 0 : i - 4; // Start from day 1 after 5 empty cells
            const isToday = dayNumber === new Date().getDate();
            
            return (
              <Box
                key={i}
                sx={{
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  backgroundColor: isToday ? 'primary.main' : 'transparent',
                  color: isToday ? 'primary.contrastText' : 'text.primary',
                  fontWeight: isToday ? 600 : 400,
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: isToday ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                {dayNumber > 0 && dayNumber <= 31 ? dayNumber : ''}
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Events section */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Événements à venir
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="18 - 19"
                size="small"
                color="error"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Fête du Kebab
              </Typography>
              <Chip label="Fermé" size="small" color="error" />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="30"
                size="small"
                color="success"
                variant="outlined"
              />
              <Typography variant="body2" color="text.secondary">
                Fête d'indépendance
              </Typography>
              <Chip label="Ouvert" size="small" color="success" />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CalendarWidget; 