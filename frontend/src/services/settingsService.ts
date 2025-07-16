import axios from 'axios';

/**
 * Settings Interface
 * Defines the structure of system settings
 */
export interface Settings {
  id: number;
  website_url: string | null;
  holiday_mode: 'default' | 'manual';
  theme: 'light' | 'dark';
  salon_name: string | null;
  salon_address: string | null;
  salon_phone: string | null;
  salon_email: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

/**
 * Settings Update Data Interface
 * Defines the structure for updating settings
 */
export interface SettingsUpdateData {
  website_url?: string | null;
  holiday_mode?: 'default' | 'manual';
  theme?: 'light' | 'dark';
  salon_name?: string | null;
  salon_address?: string | null;
  salon_phone?: string | null;
  salon_email?: string | null;
  timezone?: string;
}

/**
 * API Response Interface
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Settings Service Class
 * Handles all settings-related API operations
 */
class SettingsService {
  private readonly baseURL = '/api';
  
  /**
   * Get authentication headers
   */
  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Retrieve current system settings
   * Available to all authenticated users
   * 
   * @returns Promise<Settings>
   */
  async getSettings(): Promise<Settings> {
    try {
      const response = await axios.get<ApiResponse<Settings>>(
        `${this.baseURL}/settings`,
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to retrieve settings');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to retrieve settings');
      }
      throw new Error('Network error while retrieving settings');
    }
  }

  /**
   * Update system settings
   * Admin/Owner only operation
   * 
   * @param data - Settings data to update
   * @returns Promise<Settings>
   */
  async updateSettings(data: SettingsUpdateData): Promise<Settings> {
    try {
      // Get current settings to determine the ID for the update
      const currentSettings = await this.getSettings();
      
      const response = await axios.put<ApiResponse<Settings>>(
        `${this.baseURL}/admin/settings/${currentSettings.id}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update settings');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.message || 'Failed to update settings';
        const validationErrors = error.response.data?.errors;
        
        if (validationErrors) {
          // Format validation errors for display
          const errorMessages = Object.values(validationErrors).flat().join(', ');
          throw new Error(`Validation error: ${errorMessages}`);
        }
        
        throw new Error(errorMessage);
      }
      throw new Error('Network error while updating settings');
    }
  }

  /**
   * Reset settings to default values
   * Admin/Owner only operation
   * 
   * @returns Promise<Settings>
   */
  async resetSettings(): Promise<Settings> {
    try {
      // Get current settings to determine the ID for the reset
      const currentSettings = await this.getSettings();
      
      const response = await axios.delete<ApiResponse<Settings>>(
        `${this.baseURL}/admin/settings/${currentSettings.id}`,
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reset settings');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error resetting settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to reset settings');
      }
      throw new Error('Network error while resetting settings');
    }
  }

  /**
   * Clear settings cache
   * Admin/Owner only operation
   * 
   * @returns Promise<void>
   */
  async clearCache(): Promise<void> {
    try {
      const response = await axios.post<ApiResponse<void>>(
        `${this.baseURL}/admin/settings/cache/clear`,
        {},
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing settings cache:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Failed to clear cache');
      }
      throw new Error('Network error while clearing cache');
    }
  }

  /**
   * Update specific setting field
   * Convenience method for updating a single setting
   * 
   * @param field - The setting field to update
   * @param value - The new value for the field
   * @returns Promise<Settings>
   */
  async updateSetting<K extends keyof SettingsUpdateData>(
    field: K, 
    value: SettingsUpdateData[K]
  ): Promise<Settings> {
    const updateData = { [field]: value } as SettingsUpdateData;
    return this.updateSettings(updateData);
  }

  /**
   * Update website URL
   * Convenience method for updating website URL
   * 
   * @param url - The new website URL
   * @returns Promise<Settings>
   */
  async updateWebsiteUrl(url: string | null): Promise<Settings> {
    return this.updateSetting('website_url', url);
  }

  /**
   * Update theme setting
   * Convenience method for updating theme
   * 
   * @param theme - The new theme ('light' or 'dark')
   * @returns Promise<Settings>
   */
  async updateTheme(theme: 'light' | 'dark'): Promise<Settings> {
    return this.updateSetting('theme', theme);
  }

  /**
   * Update holiday mode setting
   * Convenience method for updating holiday mode
   * 
   * @param mode - The new holiday mode ('default' or 'manual')
   * @returns Promise<Settings>
   */
  async updateHolidayMode(mode: 'default' | 'manual'): Promise<Settings> {
    return this.updateSetting('holiday_mode', mode);
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
export default settingsService;