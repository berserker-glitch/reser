import axios from 'axios';

// Configure axios baseURL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface BookingConfirmationRequest {
  service_id: number;
  employee_id?: number;
  start_at: string;
}

export interface BookingConfirmationResponse {
  data: {
    id: number;
    salon_id: number;
    client_id: number;
    service_id: number;
    employee_id?: number;
    start_at: string;
    end_at: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

/**
 * Confirm a booking after authentication
 */
export const confirmBooking = async (
  bookingData: BookingConfirmationRequest
): Promise<BookingConfirmationResponse> => {
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post('/api/reservations', bookingData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.data;
      } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to confirm booking');
    }
}; 