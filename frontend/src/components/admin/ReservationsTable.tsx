import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Box,
  Button,
} from '@mui/material';
import {
  Edit,
  Delete,
  MoreVert,
  Add,
  Event,
} from '@mui/icons-material';
// Date formatting imports removed - not currently used

interface Reservation {
  id: number;
  client_id: number;
  employee_id: number;
  service_id: number;
  start_at: string;
  end_at: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

interface ReservationsTableProps {
  data?: Reservation[];
  loading?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return 'success';
    case 'REQUESTED':
      return 'warning';
    case 'CANCELLED':
      return 'error';
    case 'COMPLETED':
      return 'info';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmé';
    case 'REQUESTED':
      return 'En attente';
    case 'CANCELLED':
      return 'Annulé';
    case 'COMPLETED':
      return 'Terminé';
    default:
      return status;
  }
};

const ReservationsTable: React.FC<ReservationsTableProps> = ({
  data = [],
  loading = false,
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Liste des rendez-vous"
        subtitle={
          <Typography variant="body2" color="text.secondary">
            Dernières réservations
          </Typography>
        }
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            size="small"
          >
            Ajouter
          </Button>
        }
        avatar={<Event color="primary" />}
      />
      <CardContent sx={{ pt: 0 }}>
        {data.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              Aucune réservation trouvée
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Nom Fichier</TableCell>
                  <TableCell>Objet</TableCell>
                  <TableCell>Fichier Téléchargé</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.slice(0, 8).map((reservation) => (
                  <TableRow
                    key={reservation.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2">
                        Demande d'inscription
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Inscription
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        Nom du fichier exemple .pdf
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        Pas de rapport
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(reservation.status)}
                        color={getStatusColor(reservation.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ReservationsTable; 