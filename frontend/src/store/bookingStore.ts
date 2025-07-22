import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for the booking flow
export interface Salon {
  id: number;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  duration_min: number;
  price_dhs: number;
  salon_id: number;
}

export interface Employee {
  id: number;
  full_name: string;
  phone?: string;
  profile_picture?: string;
  note?: string;
  salon_id: number;
  services?: Service[];
}

export interface TempBooking {
  id?: string;
  salon_id: number;
  service_id: number;
  employee_id?: number;
  start_at: string;
  end_at: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  created_at?: string;
}

export interface BookingStep {
  step: number;
  name: string;
  path: string;
  completed: boolean;
}

interface BookingState {
  // Current salon context
  salonSlug: string | null;
  salon: Salon | null;
  
  // Booking selections
  selectedService: Service | null;
  selectedEmployee: Employee | null;
  selectedDateTime: string | null;
  
  // Temporary booking data
  tempBooking: TempBooking | null;
  
  // Flow management
  currentStep: number;
  steps: BookingStep[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSalon: (salon: Salon) => void;
  setService: (service: Service | null) => void;
  setEmployee: (employee: Employee | null) => void;
  setDateTime: (dateTime: string | null) => void;
  setTempBooking: (booking: TempBooking | null) => void;
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearBooking: () => void;
  canProceedToStep: (step: number) => boolean;
  getNextIncompleteStep: () => number;
}

const BOOKING_STEPS: BookingStep[] = [
  { step: 1, name: 'Service', path: '/book/service', completed: false },
  { step: 2, name: 'Employee', path: '/book/employee', completed: false },
  { step: 3, name: 'Date & Time', path: '/book/datetime', completed: false },
  { step: 4, name: 'Login', path: '/book/auth', completed: false },
  { step: 5, name: 'Confirmation', path: '/book/confirm', completed: false },
];

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      // Initial state
      salonSlug: null,
      salon: null,
      selectedService: null,
      selectedEmployee: null,
      selectedDateTime: null,
      tempBooking: null,
      currentStep: 1,
      steps: [...BOOKING_STEPS],
      isLoading: false,
      error: null,

      // Actions
      setSalon: (salon) => {
        set((state) => ({
          salonSlug: salon.slug,
          salon,
          // Reset booking when salon changes
          selectedService: null,
          selectedEmployee: null,
          selectedDateTime: null,
          tempBooking: null,
          currentStep: 1,
          steps: BOOKING_STEPS.map(step => ({ ...step, completed: false })),
          error: null,
        }));
      },

      setService: (service) => {
        set((state) => {
          const newSteps = [...state.steps];
          if (service) {
            newSteps[0].completed = true; // Mark service step as completed
          } else {
            // If service is cleared, reset subsequent steps
            newSteps.forEach((step, index) => {
              if (index > 0) step.completed = false;
            });
          }
          
          return {
            selectedService: service,
            // Reset employee if service changes (employee might not offer this service)
            selectedEmployee: service !== state.selectedService ? null : state.selectedEmployee,
            selectedDateTime: service !== state.selectedService ? null : state.selectedDateTime,
            steps: newSteps,
            error: null,
          };
        });
      },

      setEmployee: (employee) => {
        set((state) => {
          const newSteps = [...state.steps];
          if (employee) {
            newSteps[1].completed = true; // Mark employee step as completed
          } else {
            // If employee is cleared, reset subsequent steps
            newSteps.forEach((step, index) => {
              if (index > 1) step.completed = false;
            });
          }
          
          return {
            selectedEmployee: employee,
            selectedDateTime: employee !== state.selectedEmployee ? null : state.selectedDateTime,
            steps: newSteps,
            error: null,
          };
        });
      },

      setDateTime: (dateTime) => {
        set((state) => {
          const newSteps = [...state.steps];
          if (dateTime) {
            newSteps[2].completed = true; // Mark datetime step as completed
          } else {
            newSteps[2].completed = false;
          }
          
          return {
            selectedDateTime: dateTime,
            steps: newSteps,
            error: null,
          };
        });
      },

      setTempBooking: (booking) => {
        set({ tempBooking: booking });
      },

      setCurrentStep: (step) => {
        set({ currentStep: step });
      },

      markStepCompleted: (step) => {
        set((state) => {
          const newSteps = [...state.steps];
          const stepIndex = step - 1;
          if (stepIndex >= 0 && stepIndex < newSteps.length) {
            newSteps[stepIndex].completed = true;
          }
          return { steps: newSteps };
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearBooking: () => {
        set({
          salonSlug: null,
          salon: null,
          selectedService: null,
          selectedEmployee: null,
          selectedDateTime: null,
          tempBooking: null,
          currentStep: 1,
          steps: BOOKING_STEPS.map(step => ({ ...step, completed: false })),
          isLoading: false,
          error: null,
        });
      },

      canProceedToStep: (step) => {
        const state = get();
        
        // Can always go to step 1
        if (step <= 1) return true;
        
        // For other steps, check if previous steps are completed
        const requiredSteps = step - 1;
        for (let i = 0; i < requiredSteps; i++) {
          if (!state.steps[i].completed) {
            return false;
          }
        }
        
        return true;
      },

      getNextIncompleteStep: () => {
        const state = get();
        const incompleteStep = state.steps.find(step => !step.completed);
        return incompleteStep ? incompleteStep.step : state.steps.length;
      },
    }),
    {
      name: 'booking-store', // Name for localStorage
      // Only persist certain fields to avoid storing large objects
      partialize: (state) => ({
        salonSlug: state.salonSlug,
        salon: state.salon,
        selectedService: state.selectedService,
        selectedEmployee: state.selectedEmployee,
        selectedDateTime: state.selectedDateTime,
        tempBooking: state.tempBooking,
        currentStep: state.currentStep,
        steps: state.steps,
      }),
    }
  )
); 