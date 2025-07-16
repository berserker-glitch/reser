import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  HomeOutlined,
  PersonOutlined,
  MailOutlined,
  CalendarTodayOutlined,
  RefreshOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import React from 'react';

export interface NavItem {
  id: string;
  iconName: string; // Store icon name instead of React element
  path: string;
  label: string;
}

// Icon mapping for serialization-safe storage
export const iconMap = {
  HomeOutlined,
  PersonOutlined,
  MailOutlined,
  CalendarTodayOutlined,
  RefreshOutlined,
  SettingsOutlined,
};

// Helper function to get React element from icon name
export const getIconElement = (iconName: string): React.ReactElement => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  
  // Fallback to HomeOutlined if icon not found
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in iconMap, using HomeOutlined as fallback`);
    return React.createElement(HomeOutlined);
  }
  
  return React.createElement(IconComponent);
};

// Default navigation items (storing icon names instead of elements)
export const defaultNavigationItems: NavItem[] = [
  { 
    id: 'dashboard', 
    iconName: 'HomeOutlined', 
    path: '/admin', 
    label: 'Tableau de bord' 
  },
  { 
    id: 'employees', 
    iconName: 'PersonOutlined', 
    path: '/admin/employees', 
    label: 'Employés' 
  },
  { 
    id: 'reservations', 
    iconName: 'MailOutlined', 
    path: '/admin/reservations', 
    label: 'Réservations' 
  },
  { 
    id: 'services', 
    iconName: 'CalendarTodayOutlined', 
    path: '/admin/services', 
    label: 'Services' 
  },
  { 
    id: 'reports', 
    iconName: 'RefreshOutlined', 
    path: '/admin/reports', 
    label: 'Rapports' 
  },
  { 
    id: 'settings', 
    iconName: 'SettingsOutlined', 
    path: '/admin/settings', 
    label: 'Paramètres' 
  },
];

interface NavigationStore {
  navigationItems: NavItem[];
  reorderNavigation: (fromIndex: number, toIndex: number) => void;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set) => ({
      navigationItems: defaultNavigationItems,
      
      reorderNavigation: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const newItems = [...state.navigationItems];
          const [removed] = newItems.splice(fromIndex, 1);
          newItems.splice(toIndex, 0, removed);
          return { navigationItems: newItems };
        });
      },
      
      resetNavigation: () => {
        set({ navigationItems: defaultNavigationItems });
      },
    }),
    {
      name: 'navigation-storage',
      // Add version to force cache invalidation when structure changes
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // If version mismatch or invalid structure, reset to defaults
        if (version !== 1 || !persistedState?.navigationItems) {
          console.log('Resetting navigation storage due to version/structure mismatch');
          return { navigationItems: defaultNavigationItems };
        }
        
        // Validate that all items have iconName instead of icon
        const items = persistedState.navigationItems;
        const hasInvalidItems = items.some((item: any) => !item.iconName || item.icon);
        
        if (hasInvalidItems) {
          console.log('Resetting navigation storage due to invalid item structure');
          return { navigationItems: defaultNavigationItems };
        }
        
        return persistedState;
      },
    }
  )
); 