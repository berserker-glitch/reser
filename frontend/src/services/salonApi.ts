import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Add request interceptor to include auth header
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Service {
  id: number;
  name: string;
  description: string;
  duration_min: number;
  price_dhs: number;
}

export interface Employee {
  id: number;
  full_name: string;
  phone?: string;
  services: Service[];
}

export interface WorkingHour {
  id: number;
  employee_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
}

export interface HolidaySetting {
  id: number;
  salon_id: number;
  holiday_system_type: 'standard' | 'custom';
}

export interface Salon {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  services: Service[];
  employees: Employee[];
  working_hours: WorkingHour[];
  holiday_settings: HolidaySetting;
}

export interface SalonDiscoveryResponse {
  salon: Salon;
  services: Service[];
  employees: Employee[];
  working_hours: WorkingHour[];
  holiday_settings: HolidaySetting;
}

export interface AvailabilityResponse {
  slots: string[];
  date: string;
  service_id: number;
  employee_id?: number;
}

export interface GuestBookingRequest {
  service_id: number;
  employee_id?: number;
  start_at: string;
}

export interface TempBookingResponse {
  success: boolean;
  message: string;
  data: {
    temp_booking_id: string;
    expires_at: string;
  };
}

export interface UserSalonAssociationResponse {
  success: boolean;
  message: string;
  data: {
    user_salon: {
      id: number;
      salon_id: number;
      registered_at: string;
      status: string;
    };
  };
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Fetch salon information along with services, employees, and settings
 */
export const fetchSalonBySlug = async (slug: string): Promise<SalonDiscoveryResponse> => {
  try {
    const response = await axios.get(`/api/salon/${slug}`);
    
    return response.data.data || response.data;
  } catch (error: any) {
    
    if (error.response?.status === 404) {
      throw new Error('Salon not found');
    }
    
    throw new Error('Failed to fetch salon information');
  }
};

/**
 * Fetch available time slots for a specific service/employee/date
 */
export const fetchAvailability = async (
  salonSlug: string,
  serviceId: number,
  date: string,
  employeeId?: number
): Promise<AvailabilityResponse> => {
  try {
    const params = new URLSearchParams({
      service_id: serviceId.toString(),
      date,
    });
    
    if (employeeId) {
      params.append('employee_id', employeeId.toString());
    }
    
    const response = await axios.get(`/api/salon/${salonSlug}/availability?${params}`);
    
    return response.data;
  } catch (error: any) {
    throw new Error('Failed to fetch availability');
  }
};

/**
 * Create a temporary guest booking before authentication
 */
export const createGuestBooking = async (
  salonSlug: string,
  bookingData: GuestBookingRequest
): Promise<TempBookingResponse> => {
  try {
    const response = await fetch(`${API_BASE}/salon/${salonSlug}/book-guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error('Failed to create temporary booking');
  }
};

/**
 * Associate authenticated user with a salon
 */
export const associateUserWithSalon = async (salonId: number): Promise<UserSalonAssociationResponse> => {
  try {
    const response = await axios.post(`/api/user/salons/${salonId}`);
    
    return response.data;
  } catch (error: any) {
    throw new Error('Failed to associate user with salon');
  }
};

/**
 * Fetch user's salon-specific dashboard data
 */
export const fetchUserSalonDashboard = async (salonId: number) => {
  try {
    const response = await axios.get(`/api/user/salon/${salonId}/dashboard`);
    
    return response.data;
  } catch (error: any) {
    throw new Error('Failed to fetch salon dashboard');
  }
};

/**
 * Confirm a guest booking after authentication
 */
export const confirmGuestBooking = async (tempBookingId: string) => {
  try {
    const response = await axios.post('/api/bookings/confirm', {
      temp_booking_id: tempBookingId,
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error('Failed to confirm booking');
  }
}; 