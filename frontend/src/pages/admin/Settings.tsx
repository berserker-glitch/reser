import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Schedule,
  Lock,
  Person,
  Save,
  RestartAlt,
  AccessTime,
  EventAvailable,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Types
interface WorkingHoursState {
  [key: number]: {
    isWorking: boolean;
    start_time: string;
    end_time: string;
    hasBreak: boolean;
    break_start: string;
    break_end: string;
  };
}

interface PasswordChangeForm {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
}

// Days of the week
const WEEKDAYS = [
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
  { value: 0, label: 'Dimanche', short: 'Dim' },
];

/**
 * Settings Component
 * 
 * Comprehensive settings page with:
 * - Working hours management with weekly schedule
 * - Password change functionality
 * - Profile information updates
 * - Visual working hours overview
 */
const Settings: React.FC = () => {
  const queryClient = useQueryClient();

  // State management
  const [workingHours, setWorkingHours] = useState<WorkingHoursState>({});
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    full_name: '',
    email: '',
    phone: '',
  });
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewDialog, setPreviewDialog] = useState(false);
  const [resetConfirmDialog, setResetConfirmDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  // Initialize default working hours
  useEffect(() => {
    const defaultHours: WorkingHoursState = {};
    WEEKDAYS.forEach(day => {
      defaultHours[day.value] = {
        isWorking: day.value !== 0, // Sunday off by default
        start_time: '09:00',
        end_time: '18:00',
        hasBreak: true,
        break_start: '12:00',
        break_end: '13:00',
      };
    });
    setWorkingHours(defaultHours);
  }, []);

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      });
      return response.data.user;
    },
  });

  // Set profile form when user data loads
  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile]);

  // Fetch working hours
  const { data: workingHoursData, isLoading: loadingWorkingHours } = useQuery({
    queryKey: ['myWorkingHours'],
    queryFn: async () => {
      const response = await axios.get('/api/my-working-hours', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      });
      return response.data;
    },
  });

  // Set working hours when data loads
  useEffect(() => {
    if (workingHoursData?.success && workingHoursData.working_hours) {
      const hoursState: WorkingHoursState = {};
      
      // Initialize all days as non-working
      WEEKDAYS.forEach(day => {
        hoursState[day.value] = {
          isWorking: false,
          start_time: '09:00',
          end_time: '18:00',
          hasBreak: false,
          break_start: '12:00',
          break_end: '13:00',
        };
      });

      // Set working days from API data - only mark as working if times are not null
      workingHoursData.working_hours.forEach((hour: any) => {
        const isWorkingDay = !!(hour.start_time && hour.end_time);
        hoursState[hour.weekday] = {
          isWorking: isWorkingDay,
          start_time: hour.start_time?.substring(0, 5) || '09:00',
          end_time: hour.end_time?.substring(0, 5) || '18:00',
          hasBreak: isWorkingDay && !!(hour.break_start && hour.break_end),
          break_start: hour.break_start?.substring(0, 5) || '12:00',
          break_end: hour.break_end?.substring(0, 5) || '13:00',
        };
      });

      setWorkingHours(hoursState);
    }
  }, [workingHoursData]);

  // Update working hours mutation
  const updateWorkingHoursMutation = useMutation({
    mutationFn: async (hours: WorkingHoursState) => {
      // Send all 7 days, including non-working days with null times
      const workingHoursArray = Object.entries(hours).map(([weekday, dayData]) => ({
        weekday: parseInt(weekday),
        // Set times to null for non-working days, actual times for working days
        start_time: dayData.isWorking ? dayData.start_time : null,
        end_time: dayData.isWorking ? dayData.end_time : null,
        break_start: dayData.isWorking && dayData.hasBreak ? dayData.break_start : null,
        break_end: dayData.isWorking && dayData.hasBreak ? dayData.break_end : null,
      }));

      const response = await axios.put('/api/my-working-hours', {
        working_hours: workingHoursArray
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      });
      return response.data;
    },
  });

  // Set up success/error handling for working hours mutation
  useEffect(() => {
    if (updateWorkingHoursMutation.isSuccess) {
      setSuccessMessage('Horaires de travail mis à jour avec succès');
      setShowSuccessSnackbar(true);
      queryClient.invalidateQueries({ queryKey: ['myWorkingHours'] });
    }
    if (updateWorkingHoursMutation.isError) {
      const error: any = updateWorkingHoursMutation.error;
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la mise à jour des horaires');
    }
  }, [updateWorkingHoursMutation.isSuccess, updateWorkingHoursMutation.isError, updateWorkingHoursMutation.error, queryClient]);

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeForm) => {
      const response = await axios.post('/api/auth/change-password', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      });
      return response.data;
    },
  });

  // Set up success/error handling for password change mutation
  useEffect(() => {
    if (changePasswordMutation.isSuccess) {
      setSuccessMessage('Mot de passe modifié avec succès');
      setShowSuccessSnackbar(true);
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    }
    if (changePasswordMutation.isError) {
      const error: any = changePasswordMutation.error;
      setErrorMessage(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  }, [changePasswordMutation.isSuccess, changePasswordMutation.isError, changePasswordMutation.error]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await axios.put('/api/auth/profile', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      });
      return response.data;
    },
  });

  // Set up success/error handling for profile update mutation
  useEffect(() => {
    if (updateProfileMutation.isSuccess) {
      setSuccessMessage('Profil mis à jour avec succès');
      setShowSuccessSnackbar(true);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
    if (updateProfileMutation.isError) {
      const error: any = updateProfileMutation.error;
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  }, [updateProfileMutation.isSuccess, updateProfileMutation.isError, updateProfileMutation.error, queryClient]);

  // Password verification mutation for reset confirmation
  const verifyPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await axios.post('/api/auth/verify-password', {
        password: password
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      });
      return response.data;
    },
    onSuccess: () => {
      // Password verified, proceed with reset
      const defaultHours: WorkingHoursState = {};
      WEEKDAYS.forEach(day => {
        defaultHours[day.value] = {
          isWorking: day.value !== 0,
          start_time: '09:00',
          end_time: '18:00',
          hasBreak: true,
          break_start: '12:00',
          break_end: '13:00',
        };
      });
      setWorkingHours(defaultHours);
      setResetConfirmDialog(false);
      setResetPassword('');
      setSuccessMessage('Horaires de travail réinitialisés avec succès');
      setShowSuccessSnackbar(true);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Mot de passe incorrect');
    }
  });

  // Handlers
  const handleWorkingHourChange = (weekday: number, field: string, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [field]: value
      }
    }));
  };

  const handleSaveWorkingHours = () => {
    updateWorkingHoursMutation.mutate(workingHours);
  };

  const handlePasswordChange = () => {
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setErrorMessage('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const resetWorkingHours = () => {
    setResetConfirmDialog(true);
  };

  const handleResetConfirm = () => {
    if (!resetPassword.trim()) {
      setErrorMessage('Veuillez entrer votre mot de passe');
      return;
    }
    verifyPasswordMutation.mutate(resetPassword);
  };

  const handleResetCancel = () => {
    setResetConfirmDialog(false);
    setResetPassword('');
  };

  const calculateWorkingHours = (dayData: any) => {
    if (!dayData.isWorking) return 0;
    
    const start = new Date(`2000-01-01T${dayData.start_time}:00`);
    const end = new Date(`2000-01-01T${dayData.end_time}:00`);
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (dayData.hasBreak) {
      const breakStart = new Date(`2000-01-01T${dayData.break_start}:00`);
      const breakEnd = new Date(`2000-01-01T${dayData.break_end}:00`);
      const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
      totalMinutes -= breakMinutes;
    }
    
    return totalMinutes / 60;
  };

  const getTotalWeeklyHours = () => {
    return Object.values(workingHours).reduce((total, dayData) => {
      return total + calculateWorkingHours(dayData);
    }, 0);
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Paramètres
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Working Hours Section */}
        <Box sx={{ flex: { lg: 2 } }}>
          <Card elevation={1}>
            <CardHeader
              avatar={<Schedule color="primary" />}
              title="Horaires de travail"
              subheader="Configurez vos horaires de travail hebdomadaires"
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<RestartAlt />}
                    onClick={resetWorkingHours}
                    size="small"
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    startIcon={<EventAvailable />}
                    onClick={() => setPreviewDialog(true)}
                    variant="outlined"
                    size="small"
                  >
                    Aperçu
                  </Button>
                </Box>
              }
            />
            <CardContent>
              {loadingWorkingHours ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ mb: 3 }}>
                  {WEEKDAYS.map(day => {
                    const dayData = workingHours[day.value] || {
                      isWorking: false,
                      start_time: '09:00',
                      end_time: '18:00',
                      hasBreak: false,
                      break_start: '12:00',
                      break_end: '13:00',
                    };

                    return (
                      <Paper key={day.value} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 2, 
                          alignItems: 'center',
                        }}>
                          <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, minWidth: 200 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={dayData.isWorking}
                                  onChange={(e) => handleWorkingHourChange(day.value, 'isWorking', e.target.checked)}
                                  color="primary"
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle2">{day.label}</Typography>
                                  {dayData.isWorking ? (
                                    <Chip size="small" label="Ouvert" color="success" />
                                  ) : (
                                    <Chip size="small" label="Fermé" color="default" />
                                  )}
                                </Box>
                              }
                            />
                          </Box>

                          {dayData.isWorking && (
                            <>
                              <Box sx={{ flex: { xs: '1 1 45%', sm: '0 0 120px' } }}>
                                <TextField
                                  label="Début"
                                  type="time"
                                  size="small"
                                  fullWidth
                                  value={dayData.start_time}
                                  onChange={(e) => handleWorkingHourChange(day.value, 'start_time', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Box>
                              <Box sx={{ flex: { xs: '1 1 45%', sm: '0 0 120px' } }}>
                                <TextField
                                  label="Fin"
                                  type="time"
                                  size="small"
                                  fullWidth
                                  value={dayData.end_time}
                                  onChange={(e) => handleWorkingHourChange(day.value, 'end_time', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Box>

                              <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={dayData.hasBreak}
                                      onChange={(e) => handleWorkingHourChange(day.value, 'hasBreak', e.target.checked)}
                                      size="small"
                                    />
                                  }
                                  label="Pause"
                                />
                              </Box>

                              {dayData.hasBreak && (
                                <>
                                  <Box sx={{ flex: { xs: '1 1 45%', sm: '0 0 120px' } }}>
                                    <TextField
                                      label="Pause début"
                                      type="time"
                                      size="small"
                                      fullWidth
                                      value={dayData.break_start}
                                      onChange={(e) => handleWorkingHourChange(day.value, 'break_start', e.target.value)}
                                      InputLabelProps={{ shrink: true }}
                                    />
                                  </Box>
                                  <Box sx={{ flex: { xs: '1 1 45%', sm: '0 0 120px' } }}>
                                    <TextField
                                      label="Pause fin"
                                      type="time"
                                      size="small"
                                      fullWidth
                                      value={dayData.break_end}
                                      onChange={(e) => handleWorkingHourChange(day.value, 'break_end', e.target.value)}
                                      InputLabelProps={{ shrink: true }}
                                    />
                                  </Box>
                                </>
                              )}
                            </>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                    <Typography variant="h6" color="primary">
                      Total hebdomadaire: {getTotalWeeklyHours().toFixed(1)} heures
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveWorkingHours}
                      disabled={updateWorkingHoursMutation.isPending}
                      size="large"
                    >
                      {updateWorkingHoursMutation.isPending ? 'Enregistrement...' : 'Enregistrer les horaires'}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right Column */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Profile Information */}
          <Card elevation={1}>
            <CardHeader
              avatar={<Person color="primary" />}
              title="Informations du profil"
              subheader="Mettez à jour vos informations personnelles"
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Nom complet"
                  fullWidth
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                />
                <TextField
                  label="Téléphone"
                  fullWidth
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleProfileUpdate}
                  disabled={updateProfileMutation.isPending}
                  startIcon={<Save />}
                >
                  {updateProfileMutation.isPending ? 'Mise à jour...' : 'Mettre à jour le profil'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card elevation={1}>
            <CardHeader
              avatar={<Lock color="primary" />}
              title="Changer le mot de passe"
              subheader="Sécurisez votre compte"
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Mot de passe actuel"
                  type="password"
                  fullWidth
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                />
                <TextField
                  label="Nouveau mot de passe"
                  type="password"
                  fullWidth
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                />
                <TextField
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  fullWidth
                  value={passwordForm.new_password_confirmation}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                />
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                  startIcon={<Lock />}
                >
                  {changePasswordMutation.isPending ? 'Changement...' : 'Changer le mot de passe'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Working Hours Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime color="primary" />
            Aperçu des horaires de travail
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Jour</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Horaires</strong></TableCell>
                  <TableCell><strong>Pause</strong></TableCell>
                  <TableCell><strong>Heures travaillées</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {WEEKDAYS.map(day => {
                  const dayData = workingHours[day.value] || { isWorking: false };
                  const dailyWorkingHours = calculateWorkingHours(dayData);
                  
                  return (
                    <TableRow key={day.value}>
                      <TableCell>{day.label}</TableCell>
                      <TableCell>
                        {dayData.isWorking ? (
                          <Chip size="small" label="Ouvert" color="success" />
                        ) : (
                          <Chip size="small" label="Fermé" color="default" />
                        )}
                      </TableCell>
                      <TableCell>
                        {dayData.isWorking ? `${dayData.start_time} - ${dayData.end_time}` : '-'}
                      </TableCell>
                      <TableCell>
                        {dayData.isWorking && dayData.hasBreak ? 
                          `${dayData.break_start} - ${dayData.break_end}` : '-'}
                      </TableCell>
                      <TableCell>
                        {dayData.isWorking ? `${dailyWorkingHours.toFixed(1)}h` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={4}><strong>Total hebdomadaire</strong></TableCell>
                  <TableCell><strong>{getTotalWeeklyHours().toFixed(1)}h</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Working Hours Confirmation Dialog */}
      <Dialog
        open={resetConfirmDialog}
        onClose={handleResetCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestartAlt color="warning" />
            Réinitialiser les horaires de travail
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cette action va réinitialiser tous vos horaires de travail aux valeurs par défaut. 
            Cette opération est irréversible.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Pour confirmer cette action, veuillez entrer votre mot de passe :
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Mot de passe"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            variant="outlined"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleResetConfirm();
              }
            }}
            disabled={verifyPasswordMutation.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleResetCancel}
            disabled={verifyPasswordMutation.isPending}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleResetConfirm}
            variant="contained"
            color="warning"
            disabled={verifyPasswordMutation.isPending || !resetPassword.trim()}
            startIcon={verifyPasswordMutation.isPending ? <CircularProgress size={20} /> : <RestartAlt />}
          >
            {verifyPasswordMutation.isPending ? 'Vérification...' : 'Réinitialiser'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowSuccessSnackbar(false)} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={4000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 