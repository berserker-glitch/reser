import axios from 'axios';

// Configure axios baseURL
axios.defaults.baseURL = 'http://localhost:8000';

// Types
export interface Holiday {
  id: string; // Date in YYYY-MM-DD format
  name: string;
  type: 'national' | 'islamic';
  description?: string;
}

export interface IslamicHoliday {
  name: string;
  date: string; // YYYY-MM-DD format
  hijriDate?: string;
}

/**
 * Fetch Moroccan national holidays from backend
 */
export const fetchNationalHolidays = async (): Promise<Holiday[]> => {
  const token = localStorage.getItem('admin_token') || 
                localStorage.getItem('access_token') || 
                localStorage.getItem('client_token') ||
                localStorage.getItem('token');
  
  try {
    // Try authenticated request first
    let response;
    if (token) {
      response = await axios.get('/api/holidays', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      // Fallback to public endpoint for unauthenticated users
      response = await axios.get('/api/public/holidays');
    }
    
    return response.data.map((holiday: any) => ({
      id: holiday.id,
      name: holiday.name,
      type: 'national' as const,
    }));
  } catch (error: any) {
    console.error('Failed to fetch national holidays:', error);
    throw error;
  }
};

/**
 * Fetch Islamic holidays (Eid al-Fitr and Eid al-Adha) from AlAdhan API
 * These are moon-based and need to be fetched from an Islamic calendar API
 */
export const fetchIslamicHolidays = async (year: number): Promise<IslamicHoliday[]> => {
  try {
    // Using AlAdhan API to get Islamic calendar data for Morocco
    // Morocco primarily follows the Umm al-Qura calendar for Islamic dates
    const response = await axios.get(
      `https://api.aladhan.com/v1/calendar/${year}`,
      {
        params: {
          latitude: 33.5731, // Rabat coordinates
          longitude: -7.5898,
          method: 12, // Morocco calculation method
          adjustment: 0
        }
      }
    );

    const holidays: IslamicHoliday[] = [];
    
    // Parse the calendar data to find major Islamic holidays
    if (response.data && response.data.data) {
      const calendar = response.data.data;
      
      // Look for Eid al-Fitr (1st of Shawwal) and Eid al-Adha (10th of Dhul Hijjah)
      Object.values(calendar).forEach((month: any) => {
        if (Array.isArray(month)) {
          month.forEach((day: any) => {
            const hijriDate = day.date?.hijri;
            if (hijriDate) {
              const hijriMonth = hijriDate.month?.number;
              const hijriDay = hijriDate.day;
              
              // Eid al-Fitr (1st of Shawwal - month 10)
              if (hijriMonth === 10 && hijriDay === 1) {
                holidays.push({
                  name: 'Eid al-Fitr (عيد الفطر)',
                  date: day.date.gregorian.date,
                  hijriDate: `${hijriDay} ${hijriDate.month.ar}`,
                });
              }
              
              // Eid al-Adha (10th of Dhul Hijjah - month 12)
              if (hijriMonth === 12 && hijriDay === 10) {
                holidays.push({
                  name: 'Eid al-Adha (عيد الأضحى)',
                  date: day.date.gregorian.date,
                  hijriDate: `${hijriDay} ${hijriDate.month.ar}`,
                });
              }
            }
          });
        }
      });
    }
    
    return holidays;
  } catch (error) {
    console.error('Failed to fetch Islamic holidays:', error);
    
    // Fallback: Return approximate dates based on astronomical calculations
    // Note: These are estimates and should be verified with local authorities
    return getApproximateIslamicHolidays(year);
  }
};

/**
 * Fallback function for approximate Islamic holiday dates
 * These are rough estimates and should be replaced with accurate local calculations
 */
const getApproximateIslamicHolidays = (year: number): IslamicHoliday[] => {
  // These are very rough estimates and should not be used in production
  // Actual Islamic holidays depend on moon sighting and local declarations
  const holidays: IslamicHoliday[] = [];
  
  // Approximate Eid dates for common years (these change annually)
  const approximateDates: { [key: number]: { eidFitr: string; eidAdha: string } } = {
    2024: { eidFitr: '2024-04-10', eidAdha: '2024-06-16' },
    2025: { eidFitr: '2025-03-30', eidAdha: '2025-06-06' },
    2026: { eidFitr: '2026-03-20', eidAdha: '2026-05-26' },
  };
  
  const yearData = approximateDates[year];
  if (yearData) {
    holidays.push(
      {
        name: 'Eid al-Fitr (عيد الفطر) - تقديري',
        date: yearData.eidFitr,
        hijriDate: '1 شوال',
      },
      {
        name: 'Eid al-Adha (عيد الأضحى) - تقديري',
        date: yearData.eidAdha,
        hijriDate: '10 ذو الحجة',
      }
    );
  }
  
  return holidays;
};

/**
 * Get all holidays for a specific year (both national and Islamic)
 */
export const getAllHolidays = async (year: number): Promise<Holiday[]> => {
  try {
    const [nationalHolidays, islamicHolidays] = await Promise.all([
      fetchNationalHolidays(),
      fetchIslamicHolidays(year)
    ]);
    
    // Convert Islamic holidays to Holiday format
    const islamicHolidaysFormatted: Holiday[] = islamicHolidays.map(holiday => ({
      id: holiday.date,
      name: holiday.name,
      type: 'islamic' as const,
      description: holiday.hijriDate ? `التاريخ الهجري: ${holiday.hijriDate}` : undefined,
    }));
    
    // Combine and deduplicate holidays
    const allHolidays = [...nationalHolidays, ...islamicHolidaysFormatted];
    const uniqueHolidays = allHolidays.reduce((acc, holiday) => {
      const existingIndex = acc.findIndex(h => h.id === holiday.id);
      if (existingIndex === -1) {
        acc.push(holiday);
      } else {
        // If we have both national and Islamic holiday on same date, combine them
        acc[existingIndex] = {
          ...acc[existingIndex],
          name: `${acc[existingIndex].name} / ${holiday.name}`,
          description: [acc[existingIndex].description, holiday.description]
            .filter(Boolean).join(' | '),
        };
      }
      return acc;
    }, [] as Holiday[]);
    
    return uniqueHolidays;
  } catch (error) {
    console.error('Failed to fetch all holidays:', error);
    throw error;
  }
}; 