import { useMemo } from 'react';

export interface SalonContext {
  salonId: number | null;
  isOwner: boolean;
  isClient: boolean;
  salonName?: string;
}

/**
 * Hook to get salon context for the current user
 * 
 * For admin users (OWNER): Gets salon ID from their owned salon
 * For client users (CLIENT): Uses default salon ID (could be enhanced with salon selection)
 */
export const useSalonContext = (): SalonContext => {
  return useMemo(() => {
    // Try to get admin user data first
    const adminUserData = localStorage.getItem('admin_user');
    const adminSalonData = localStorage.getItem('admin_salon');
    
    if (adminUserData) {
      try {
        const adminUser = JSON.parse(adminUserData);
        if (adminUser.role === 'OWNER') {
          // Get the actual salon ID from stored salon data
          let salonId = null;
          let salonName = 'Salon Admin';
          
          if (adminSalonData) {
            try {
              const adminSalon = JSON.parse(adminSalonData);
              salonId = adminSalon.id;
              salonName = adminSalon.name || 'Salon Admin';
            } catch (error) {
              console.error('Error parsing admin salon data:', error);
            }
          }
          
          return {
            salonId,
            isOwner: true,
            isClient: false,
            salonName,
          };
        }
      } catch (error) {
        console.error('Error parsing admin user data:', error);
      }
    }

    // Try to get client user data
    const clientUserData = localStorage.getItem('client_user');
    if (clientUserData) {
      try {
        const clientUser = JSON.parse(clientUserData);
        if (clientUser.role === 'CLIENT') {
          // For client users, we'll use a default salon for now
          // This could be enhanced to allow salon selection
          return {
            salonId: 1, // Default salon ID for clients
            isOwner: false,
            isClient: true,
          };
        }
      } catch (error) {
        console.error('Error parsing client user data:', error);
      }
    }

    // No valid user context found
    return {
      salonId: null,
      isOwner: false,
      isClient: false,
    };
  }, []);
};

/**
 * Hook to get salon ID specifically (throws if not available)
 */
export const useSalonId = (): number => {
  const { salonId } = useSalonContext();
  
  if (salonId === null) {
    throw new Error('Salon context not available. User must be authenticated.');
  }
  
  return salonId;
}; 