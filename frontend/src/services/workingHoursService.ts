import axios from 'axios';

// Configure axios baseURL (matching holidayService pattern)
axios.defaults.baseURL = 'http://localhost:8000';

/**
 * Working Hours Service
 * Handles fetching working hours data from the backend API
 */

export interface WorkingHour {
  id: number;
  employee_id: number;
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string | null; // HH:MM:SS format or null for non-working days
  end_time: string | null; // HH:MM:SS format or null for non-working days
  break_start: string | null;
  break_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  full_name: string;
}

export interface WorkingHoursGroup {
  employee: Employee;
  schedule: {
    id: number;
    weekday: number;
    weekday_name: string;
    start_time: string | null;
    end_time: string | null;
    break_start: string | null;
    break_end: string | null;
    total_hours: number;
  }[];
}

/**
 * Fetch all working hours grouped by employee
 */
export const getAllWorkingHours = async (): Promise<WorkingHoursGroup[]> => {
  try {
    // Get authentication token (try multiple possible keys)
    const token = localStorage.getItem('admin_token') || 
                  localStorage.getItem('access_token') || 
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get('/api/working-hours', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching working hours:', error);
    throw error;
  }
};

/**
 * Fetch working hours for a specific employee
 */
export const getEmployeeWorkingHours = async (employeeId: number): Promise<WorkingHour[]> => {
  try {
    // Get authentication token (try multiple possible keys)
    const token = localStorage.getItem('admin_token') || 
                  localStorage.getItem('access_token') || 
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`/api/admin/employees/${employeeId}/working-hours`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
    return response.data.schedule || [];
  } catch (error) {
    console.error(`Error fetching working hours for employee ${employeeId}:`, error);
    throw error;
  }
};

/**
 * Check if a specific weekday is a working day for any employee
 * @param weekday - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param workingHoursData - Array of working hours groups from getAllWorkingHours
 * @returns true if any employee works on this day
 */
export const isWorkingDay = (weekday: number, workingHoursData: WorkingHoursGroup[]): boolean => {
  if (!workingHoursData || workingHoursData.length === 0) {
    return false; // No working hours data, assume non-working day
  }
  
  return workingHoursData.some(group => 
    group && group.schedule && group.schedule.some(schedule => 
      schedule && 
      schedule.weekday === weekday && 
      schedule.start_time !== null && 
      schedule.end_time !== null
    )
  );
};

/**
 * Get all employees working on a specific weekday
 * @param weekday - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param workingHoursData - Array of working hours groups from getAllWorkingHours
 * @returns Array of employees with their working hours for that day
 */
export const getEmployeesWorkingOnDay = (weekday: number, workingHoursData: WorkingHoursGroup[]) => {
  if (!workingHoursData || workingHoursData.length === 0) {
    return [];
  }
  
  return workingHoursData
    .map(group => {
      if (!group || !group.schedule || !group.employee) return null;
      
      const daySchedule = group.schedule.find(schedule => 
        schedule && 
        schedule.weekday === weekday && 
        schedule.start_time !== null && 
        schedule.end_time !== null
      );
      
      if (daySchedule) {
        return {
          employee: group.employee,
          schedule: daySchedule
        };
      }
      return null;
    })
    .filter(Boolean);
}; 