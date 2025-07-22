import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import theme from './theme';
import clientTheme from './theme/clientTheme';
import HomePage from './pages/HomePage';
import { 
  AdminLogin, 
  AdminDashboard, 
  ReservationsManagement,
  EmployeesManagement,
  ServicesManagement,
  CalendarManagement,
  Reports,
  Settings,
} from './pages/admin';
import {
  ClientLogin,
  ClientDashboard,
  BookingFlow,
  ClientHistory,
} from './pages/client';
import SalonLanding from './pages/salon/SalonLanding';
import ServiceSelection from './pages/salon/BookingFlow/ServiceSelection';
import EmployeeSelection from './pages/salon/BookingFlow/EmployeeSelection';
import DateTimeSelection from './pages/salon/BookingFlow/DateTimeSelection';
import AuthGate from './pages/salon/BookingFlow/AuthGate';
import BookingConfirmation from './pages/salon/BookingFlow/BookingConfirmation';
import TokenDebugger from './pages/admin/TokenDebugger';
import { AdminLayout } from './components/admin';
import { ClientLayout } from './components/client';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorHandler from './components/GlobalErrorHandler';
import { useErrorHandler } from './hooks/useErrorHandler';

// Theme wrapper component to switch themes based on route
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isClientRoute = location.pathname.startsWith('/client');
  
  return (
    <ThemeProvider theme={isClientRoute ? clientTheme : theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Component that initializes error handling
function AppWithErrorHandling() {
  useErrorHandler({
    autoRetry: true,
    maxRetries: 2,
  });

  return (
    <>
      <BrowserRouter>
        <ThemeWrapper>
          <Routes>
            {/* Homepage */}
            <Route path="/" element={<HomePage />} />
            
            {/* Admin login route */}
            <Route path="/login" element={<AdminLogin />} />
            
            {/* Token debugger route (temporary) */}
            <Route path="/debug-tokens" element={<TokenDebugger />} />
            
            {/* Client login route */}
            <Route path="/client/login" element={<ClientLogin />} />
            
            {/* Admin dashboard routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="reservations" element={<ReservationsManagement />} />
              <Route path="employees" element={<EmployeesManagement />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="calendar" element={<CalendarManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Client dashboard routes */}
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientDashboard />} />
              <Route path="booking" element={<BookingFlow />} />
              <Route path="history" element={<ClientHistory />} />
            </Route>
            
            {/* Salon booking flow routes (public) */}
            <Route path="/salon/:salonSlug" element={<SalonLanding />} />
            <Route path="/salon/:salonSlug/book/service" element={<ServiceSelection />} />
            <Route path="/salon/:salonSlug/book/employee" element={<EmployeeSelection />} />
            <Route path="/salon/:salonSlug/book/datetime" element={<DateTimeSelection />} />
            <Route path="/salon/:salonSlug/book/auth" element={<AuthGate />} />
            <Route path="/salon/:salonSlug/book/confirm" element={<BookingConfirmation />} />
            
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeWrapper>
      </BrowserRouter>
      
      {/* Global error notifications */}
      <GlobalErrorHandler />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppWithErrorHandling />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
