import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * CalendarService - Handles calendar availability data
 * 
 * Provides methods to fetch working days, holidays, and bookable days
 * for the client booking calendar component.
 */

export interface CalendarDay {
  date: string;
  day_of_week: number;
  day_name: string;
  is_holiday: boolean;
  holiday_name: string | null;
  is_working_day: boolean;
  is_bookable: boolean;
  working_hours: {
    start_time: string;
    end_time: string;
    break_start: string | null;
    break_end: string | null;
  } | null;
}

export interface CalendarAvailabilityResponse {
  success: boolean;
  data: CalendarDay[];
  summary: {
    total_days: number;
    holidays: number;
    working_days: number;
    bookable_days: number;
  };
}

/**
 * Fetch calendar availability for a date range
 * 
 * @param salonId - Salon ID for salon isolation
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Promise<CalendarAvailabilityResponse>
 */
export const getCalendarAvailability = async (
  salonId: number,
  startDate: string,
  endDate: string
): Promise<CalendarAvailabilityResponse> => {
  try {
    console.debug('CalendarService: Fetching calendar availability', {
      salonId,
      startDate,
      endDate
    });

    const response = await axios.get(`${API_BASE_URL}/calendar-availability`, {
      params: {
        salon_id: salonId,
        start_date: startDate,
        end_date: endDate
      },
      timeout: 10000 // 10 second timeout
    });

    console.debug('CalendarService: Calendar availability fetched successfully', {
      salonId,
      startDate,
      endDate,
      totalDays: response.data.data?.length || 0,
      bookableDays: response.data.summary?.bookable_days || 0
    });

    return response.data;
  } catch (error: any) {
    console.error('CalendarService: Failed to fetch calendar availability', {
      salonId,
      startDate,
      endDate,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    throw new Error(
      error.response?.data?.error || 
      'Failed to fetch calendar availability. Please try again.'
    );
  }
};

/**
 * Get calendar availability for a specific month
 * 
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Promise<CalendarAvailabilityResponse>
 */
export const getMonthAvailability = async (
  year: number,
  month: number
): Promise<CalendarAvailabilityResponse> => {
  // Create start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.debug('CalendarService: Fetching month availability', {
    year,
    month,
    startDate: startDateStr,
    endDate: endDateStr
  });

  return getCalendarAvailability(1, startDateStr, endDateStr); // Assuming salonId is 1 for now
};

/**
 * Check if a specific date is bookable
 * Simple wrapper around getCalendarAvailability for single date checks
 * 
 * @param salonId - Salon ID for salon isolation
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Promise<boolean>
 */
export const isDateBookable = async (salonId: number, dateStr: string): Promise<boolean> => {
  try {
    const response = await getCalendarAvailability(salonId, dateStr, dateStr);
    const dayData = response.data[0];
    
    return dayData ? dayData.is_bookable : false;
  } catch (error) {
    console.error('CalendarService: Failed to check if date is bookable', {
      salonId,
      dateStr,
      error
    });
    return false;
  }
};

/**
 * Get calendar data for a date range around a specific date
 * Useful for calendar components that need context around a selected date
 * 
 * @param salonId - Salon ID for salon isolation
 * @param centerDate - Center date in YYYY-MM-DD format
 * @param daysBefore - Number of days before center date to include
 * @param daysAfter - Number of days after center date to include
 * @returns Promise<CalendarAvailabilityResponse>
 */
export const getCalendarAroundDate = async (
  salonId: number,
  centerDate: string,
  daysBefore: number = 15,
  daysAfter: number = 45
): Promise<CalendarAvailabilityResponse> => {
  const center = new Date(centerDate);
  
  const startDate = new Date(center);
  startDate.setDate(center.getDate() - daysBefore);
  
  const endDate = new Date(center);
  endDate.setDate(center.getDate() + daysAfter);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.debug('CalendarService: Fetching calendar around date', {
    salonId,
    centerDate,
    daysBefore,
    daysAfter,
    startDate: startDateStr,
    endDate: endDateStr
  });

  return getCalendarAvailability(salonId, startDateStr, endDateStr);
};

export default {
  getCalendarAvailability,
  getMonthAvailability,
  isDateBookable,
  getCalendarAroundDate
}; 