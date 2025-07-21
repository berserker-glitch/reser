import axios from 'axios';
import type { Service, Employee } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Use types from the main types file to avoid conflicts
// Service and Employee interfaces are now imported from '../../types'

export interface ServiceFormData {
  name: string;
  description?: string;
  duration_min: number;
  price_dhs: number;
}

export interface ServiceFilters {
  search?: string;
  sort_by?: 'name' | 'price_dhs' | 'duration_min' | 'created_at';
  sort_direction?: 'asc' | 'desc';
}

export interface ServiceStatistics {
  total_services: number;
  average_price: number;
  average_duration: number;
  most_popular_service: Service | null;
  revenue_this_month: number;
  services_by_duration: {
    short: number; // < 60 min
    medium: number; // 60-120 min
    long: number; // > 120 min
  };
}

/**
 * Services API Functions
 * 
 * Comprehensive CRUD operations for salon services management
 */
export const serviceApi = {
  /**
   * Get all services with optional filtering and search
   * @param filters - Optional filters for search, sorting
   * @returns Promise<Service[]>
   */
  async getServices(filters?: ServiceFilters): Promise<Service[]> {
    const params = new URLSearchParams();
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters?.sort_direction) {
      params.append('sort_direction', filters.sort_direction);
    }

    const response = await api.get(`/services?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a specific service by ID with detailed information
   * @param id - Service ID
   * @returns Promise<Service>
   */
  async getService(id: number): Promise<Service> {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  /**
   * Create a new service
   * @param serviceData - Service creation data
   * @returns Promise<Service>
   */
  async createService(serviceData: ServiceFormData): Promise<Service> {
    const response = await api.post('/services', serviceData);
    return response.data;
  },

  /**
   * Update an existing service
   * @param id - Service ID
   * @param serviceData - Service update data
   * @returns Promise<Service>
   */
  async updateService(id: number, serviceData: Partial<ServiceFormData>): Promise<Service> {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data;
  },

  /**
   * Delete a service
   * @param id - Service ID
   * @returns Promise<void>
   */
  async deleteService(id: number): Promise<void> {
    await api.delete(`/services/${id}`);
  },

  /**
   * Get services with their assigned employees
   * @returns Promise<Service[]>
   */
  async getServicesWithEmployees(): Promise<Service[]> {
    const response = await api.get('/services/with-employees');
    return response.data;
  },

  /**
   * Get service statistics for dashboard
   * @returns Promise<ServiceStatistics>
   */
  async getServiceStatistics(): Promise<ServiceStatistics> {
    const response = await api.get('/services/statistics');
    return response.data;
  },

  /**
   * Assign an employee to a service
   * @param serviceId - Service ID
   * @param employeeId - Employee ID
   * @returns Promise<void>
   */
  async assignEmployeeToService(serviceId: number, employeeId: number): Promise<void> {
    await api.post(`/services/${serviceId}/employees`, { employee_id: employeeId });
  },

  /**
   * Remove an employee from a service
   * @param serviceId - Service ID
   * @param employeeId - Employee ID
   * @returns Promise<void>
   */
  async removeEmployeeFromService(serviceId: number, employeeId: number): Promise<void> {
    await api.delete(`/services/${serviceId}/employees/${employeeId}`);
  },

  /**
   * Get all available employees for assignment
   * @returns Promise<Employee[]>
   */
  async getAvailableEmployees(): Promise<Employee[]> {
    const response = await api.get('/employees');
    return response.data;
  },

  /**
   * Bulk update service assignments for an employee
   * @param employeeId - Employee ID
   * @param serviceIds - Array of service IDs
   * @returns Promise<void>
   */
  async updateEmployeeServices(employeeId: number, serviceIds: number[]): Promise<void> {
    await api.put(`/employees/${employeeId}/services`, { service_ids: serviceIds });
  },

  /**
   * Duplicate a service (create copy with modified name)
   * @param id - Original service ID
   * @param newName - Name for the duplicated service
   * @returns Promise<Service>
   */
  async duplicateService(id: number, newName: string): Promise<Service> {
    const originalService = await this.getService(id);
    const serviceData: ServiceFormData = {
      name: newName,
      description: originalService.description,
      duration_min: originalService.duration_min,
      price_dhs: originalService.price_dhs,
    };
    return await this.createService(serviceData);
  },

  /**
   * Search services by name or description
   * @param query - Search query
   * @returns Promise<Service[]>
   */
  async searchServices(query: string): Promise<Service[]> {
    return await this.getServices({ search: query });
  },

  /**
   * Get services sorted by popularity (reservation count)
   * @returns Promise<Service[]>
   */
  async getPopularServices(): Promise<Service[]> {
    const response = await api.get('/services/popular');
    return response.data;
  },

  /**
   * Get service pricing analytics
   * @returns Promise<{min_price: number, max_price: number, avg_price: number}>
   */
  async getServicePricingAnalytics(): Promise<{
    min_price: number;
    max_price: number;
    avg_price: number;
  }> {
    const response = await api.get('/services/pricing-analytics');
    return response.data;
  },
};

export default serviceApi; 