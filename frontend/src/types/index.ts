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
  description: string
  duration_min: number
  price_dhs: number
  created_at: string
  updated_at: string
}

// Employee related types
export interface Employee {
  id: number
  user_id: number
  full_name: string
  phone?: string
  note?: string
  specialties?: Service[] // joined services
  created_at: string
  updated_at: string
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
  client_id: number
  employee_id: number
  service_id: number
  start_at: string // ISO date string
  end_at: string   // ISO date string
  status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  created_at: string
  updated_at: string
  // Relationships
  client?: User
  employee?: Employee
  service?: Service
}

// Holiday types
export interface Holiday {
  id: string // Date in YYYY-MM-DD format
  name: string
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