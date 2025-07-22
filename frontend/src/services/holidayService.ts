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
export const fetchNationalHolidays = async (salonId: number, year?: number): Promise<Holiday[]> => {
  console.log('🇲🇦 fetchNationalHolidays called with:', { salonId, year });
  
  const token = localStorage.getItem('admin_token') || 
                localStorage.getItem('access_token') || 
                localStorage.getItem('token');
  
  console.log('🔐 Auth token found:', !!token, token ? token.substring(0, 20) + '...' : 'none');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const params = new URLSearchParams({
      salon_id: salonId.toString()
    });
    
    if (year) {
      params.append('year', year.toString());
    }
    
    const url = `/api/holidays?${params.toString()}`;
    console.log('📤 Making request to:', url);
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('📥 Raw API response:', {
      status: response.status,
      data: response.data,
      success: response.data.success
    });
    
    // Handle the new response format with success wrapper
    const holidays = response.data.success ? response.data.data : response.data;
    console.log('🎯 Extracted holidays data:', holidays);
    
    const mappedHolidays = holidays.map((holiday: any) => ({
      id: holiday.date || holiday.id,
      name: holiday.name,
      type: holiday.type === 'NATIONAL' ? 'national' as const : 'islamic' as const,
    }));
    
    console.log('✅ fetchNationalHolidays final result:', mappedHolidays);
    return mappedHolidays;
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
 * Get all holidays for a specific year (from backend only, filtered by salon_id)
 */
export const getAllHolidays = async (salonId: number, year: number): Promise<Holiday[]> => {
  try {
    console.log('🎄 getAllHolidays called with:', { salonId, year });
    
    // Only use backend holidays which are properly filtered by salon_id
    const nationalHolidays = await fetchNationalHolidays(salonId, year);
    
    console.log('🇲🇦 Backend holidays received (filtered by salon):', nationalHolidays);
    
    // Return only the salon-specific holidays from backend
    console.log('✅ Final getAllHolidays result (salon filtered):', nationalHolidays);
    return nationalHolidays;
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    throw error;
  }
}; 