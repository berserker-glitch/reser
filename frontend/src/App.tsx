import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createAppTheme } from './theme';
import { CustomThemeProvider, useThemeMode } from './contexts/ThemeContext';
import HomePage from './pages/HomePage';
import { 
  AdminLogin, 
  AdminDashboard, 
  ReservationsManagement,
  EmployeesManagement,
  ServicesManagement,
  Reports,
  Settings
} from './pages/admin';
import { AdminLayout } from './components/admin';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * App Content Component
 * This component uses the theme context and must be inside CustomThemeProvider
 */
function AppContent() {
  const themeMode = useThemeMode();
  const theme = createAppTheme(themeMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
          <Routes>
            {/* Homepage */}
            <Route path="/" element={<HomePage />} />
            
            {/* Login route */}
            <Route path="/login" element={<AdminLogin />} />
            
            {/* Admin dashboard routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="reservations" element={<ReservationsManagement />} />
              <Route path="employees" element={<EmployeesManagement />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    );
}

/**
 * Main App Component
 * Wraps the application with all necessary providers
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
