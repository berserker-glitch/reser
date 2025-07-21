// User related types
export interface User {
  id: number
  email: string
  full_name: string
  phone?: string
  role: 'OWNER' | 'CLIENT'
  created_at: string
  updated_at: string
}

// Service related types
export interface Service {
  id: number
  name: string
  description?: string
  duration_min: number
  price_dhs: number
  created_at: string
  updated_at: string
  employees?: Employee[]
  reservations_count?: number
  active_employees_count?: number
}

// Service form data for creating/updating services
export interface ServiceFormData {
  name: string
  description?: string
  duration_min: number
  price_dhs: number
}

// Service filters for search and sorting
export interface ServiceFilters {
  search?: string
  sort_by?: 'name' | 'price_dhs' | 'duration_min' | 'created_at'
  sort_direction?: 'asc' | 'desc'
}

// Service statistics for dashboard
export interface ServiceStatistics {
  total_services: number
  average_price: number
  average_duration: number
  most_popular_service: Service | null
  revenue_this_month: number
  services_by_duration: {
    short: number // < 60 min
    medium: number // 60-120 min
    long: number // > 120 min
  }
}

// Employee related types
export interface Employee {
  id: number
  user_id: number
  full_name: string
  phone?: string
  profile_picture?: string
  note?: string
  services?: Service[] // joined services (renamed from specialties for consistency)
  created_at: string
  updated_at: string
}

// Employee form data for creating/updating employees
export interface EmployeeFormData {
  full_name: string
  phone?: string
  profile_picture?: string
  note?: string
  service_ids?: number[] // for service assignments
}

// Working hours types
export interface WorkingHour {
  id: number
  employee_id: number
  weekday: number // 0=Sunday, 6=Saturday
  start_time: string
  end_time: string
  break_start?: string
  break_end?: string
  created_at: string
  updated_at: string
}

// Reservation related types
export interface Reservation {
  id: number
  client_id?: number | null
  employee_id: number
  service_id: number
  start_at: string // ISO date string
  end_at: string   // ISO date string
  status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  type: 'online' | 'manual'
  client_phone?: string | null
  client_full_name?: string | null
  created_at: string
  updated_at: string
  // Relationships
  client?: User
  employee?: Employee
  service?: Service
}

// Reservation form data for creating/updating reservations
export interface ReservationFormData {
  client_id?: number | null
  employee_id: number
  service_id: number
  start_at: string // ISO date string
  status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  type: 'online' | 'manual'
  client_phone?: string
  client_full_name?: string
}

// Holiday types (recurring yearly, simplified table)
export interface Holiday {
  type: 'standard' | 'custom'
  name: string
  month: number // 1-12
  day: number   // 1-31
  date?: string // Optional: Full date when converted for a specific year
}

export interface HolidaySettings {
  id?: number
  holiday_system_type: 'standard' | 'custom'
  created_at?: string
  updated_at?: string
}

// API Response types
export interface LoginResponse {
  message: string
  user: User
  token: string
}

export interface RegisterResponse {
  message: string
  user: User
  token: string
}

export interface AvailabilityResponse {
  service_id: number
  employee_id?: number
  date: string
  slots: string[] // Array of ISO date strings
}

export interface CreateReservationRequest {
  service_id: number
  employee_id?: number
  start_at: string // ISO date string
}

export interface CreateReservationResponse {
  message: string
  reservation: Reservation
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  full_name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  role?: 'OWNER' | 'CLIENT'
}

export interface BookingForm {
  service_id: number
  employee_id?: number
  start_at: string
}

// API Error types
export interface ApiError {
  error: string
  messages?: Record<string, string[]>
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

// Auth store types
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

// Booking flow types
export interface BookingStep {
  step: number
  title: string
  completed: boolean
}

export interface BookingData {
  service?: Service
  employee?: Employee | null
  dateTime?: string
  confirmed?: boolean
} 