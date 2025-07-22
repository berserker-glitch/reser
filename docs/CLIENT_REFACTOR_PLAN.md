# Client-Side Refactor Plan: Salon-Specific Booking Flow

## Overview
Complete refactor of the client-side experience to support salon-specific URLs and a streamlined booking flow that ends with user registration/login.

## New User Journey

### 1. Landing Page Flow
```
example.com/salon-name → Service Selection → Employee Selection → Date/Time Selection → Auth Required → Confirmation
```

### Detailed Flow Steps:
1. **Salon Landing** (`/salon-name`) - User lands on salon-specific page
2. **Service Selection** - Browse and select available services
3. **Employee Selection** - Choose preferred employee or "any available"
4. **Date Selection** - Calendar view showing only working days
5. **Time Selection** - Available time slots based on working hours
6. **Authentication Gate** - Login/Register requirement before confirmation
7. **Booking Confirmation** - Final confirmation and booking creation
8. **Dashboard Access** - Post-booking dashboard for salon-specific data

## Database Changes Required

### New Table: `user_salons`
```sql
CREATE TABLE user_salons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  salon_id BIGINT UNSIGNED NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_visit TIMESTAMP NULL,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE KEY unique_user_salon (user_id, salon_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
);
```

### Updates to Existing Tables:
- **`users` table**: No changes needed (remains salon-agnostic)
- **`reservations` table**: Already has salon_id for multi-salon support

## Backend API Changes

### New Endpoints Required:

#### 1. Salon Discovery
```php
GET /api/salon/{slug}
// Returns: salon info, services, employees, working hours, holiday settings
Response: {
  "salon": { id, name, slug, description, address, phone, ... },
  "services": [ { id, name, price, duration, ... } ],
  "employees": [ { id, name, services, working_hours, ... } ],
  "working_hours": [ { employee_id, weekday, start_time, end_time, ... } ],
  "holiday_settings": { holiday_system_type, ... }
}
```

#### 2. Salon-Specific Availability
```php
GET /api/salon/{slug}/availability
Query params: service_id, employee_id?, date
// Returns: available time slots for the salon
```

#### 3. Salon-Specific Booking (Guest)
```php
POST /api/salon/{slug}/book-guest
Body: {
  service_id, employee_id?, start_at, 
  client_name, client_phone, client_email
}
// Creates temporary booking pending user registration
```

#### 4. User-Salon Association
```php
POST /api/user/salons/{salon_id}
// Associates authenticated user with salon
// Called after registration/login during booking flow
```

#### 5. User's Salon Dashboard
```php
GET /api/user/salon/{salon_id}/dashboard
// Returns: user's reservations, salon info, services for this salon
```

## Frontend Architecture Changes

### 1. New Route Structure
```typescript
// Public Routes (no auth required)
/salon/:salonSlug                    // Salon landing page
/salon/:salonSlug/book              // Booking flow
/salon/:salonSlug/book/service      // Service selection
/salon/:salonSlug/book/employee     // Employee selection  
/salon/:salonSlug/book/datetime     // Date/time selection
/salon/:salonSlug/book/auth         // Login/register gate
/salon/:salonSlug/book/confirm      // Final confirmation

// Authenticated Routes
/salon/:salonSlug/dashboard         // User's salon-specific dashboard
/salons                            // List of user's salons
/profile                           // User profile (cross-salon)
```

### 2. New Components Structure

#### Salon Public Components:
```
src/pages/salon/
├── SalonLanding.tsx              // Salon homepage
├── BookingFlow/
│   ├── BookingLayout.tsx         // Common layout
│   ├── ServiceSelection.tsx      // Step 1: Choose service
│   ├── EmployeeSelection.tsx     // Step 2: Choose employee
│   ├── DateTimeSelection.tsx     // Step 3: Choose date/time
│   ├── AuthGate.tsx             // Step 4: Login/register
│   └── BookingConfirmation.tsx   // Step 5: Confirm booking
└── SalonDashboard.tsx            // User's salon dashboard
```

#### Shared Components:
```
src/components/salon/
├── SalonHeader.tsx               // Salon branding header
├── ServiceCard.tsx               // Service display card
├── EmployeeCard.tsx              // Employee selection card
├── TimeSlotPicker.tsx            // Time selection component
└── BookingProgressBar.tsx        // Step indicator
```

### 3. State Management Updates

#### New Stores:
```typescript
// Booking Store (Zustand)
interface BookingState {
  salonSlug: string;
  salon: Salon | null;
  selectedService: Service | null;
  selectedEmployee: Employee | null;
  selectedDateTime: string | null;
  tempBooking: TempBooking | null;
  // Actions
  setSalon: (salon: Salon) => void;
  setService: (service: Service) => void;
  setEmployee: (employee: Employee) => void;
  setDateTime: (dateTime: string) => void;
  clearBooking: () => void;
}

// User Salon Store
interface UserSalonState {
  userSalons: UserSalon[];
  currentSalon: Salon | null;
  // Actions
  fetchUserSalons: () => Promise<void>;
  setCurrentSalon: (salon: Salon) => void;
  associateWithSalon: (salonId: number) => Promise<void>;
}
```

### 4. Authentication Flow Changes

#### Current Auth vs New Auth:
```typescript
// OLD: Role-based auth (OWNER/CLIENT)
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// NEW: Salon-aware auth
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  userSalons: UserSalon[];           // NEW: User's salon associations
  currentSalonContext: Salon | null; // NEW: Current salon context
  pendingBooking: TempBooking | null; // NEW: Booking awaiting auth
}
```

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
1. **Database Migration**: Create `user_salons` table
2. **Salon Model Updates**: Add slug generation, salon-specific queries
3. **New API Endpoints**: Salon discovery, availability, guest booking
4. **Auth Updates**: Support salon association after registration

### Phase 2: Booking Flow Core (Week 2)
1. **Route Structure**: Implement new salon-based routes
2. **Booking Components**: Service → Employee → DateTime selection
3. **State Management**: Booking store, temporary booking storage
4. **API Integration**: Connect frontend to new backend endpoints

### Phase 3: Authentication Integration (Week 3)
1. **Auth Gate Component**: Login/register during booking flow
2. **User-Salon Association**: Link users to salons post-auth
3. **Booking Completion**: Convert temp booking to confirmed reservation
4. **Session Management**: Maintain salon context across sessions

### Phase 4: Dashboard & Polish (Week 4)
1. **Salon Dashboard**: User's salon-specific dashboard
2. **Multi-Salon Support**: Switch between user's salons
3. **Profile Management**: Cross-salon user profile
4. **Error Handling**: Comprehensive error states and loading
5. **Testing**: End-to-end flow testing

## Technical Considerations

### 1. SEO & Performance
- **Salon Slugs**: URL-friendly salon identifiers
- **Server-Side Rendering**: Consider Next.js for salon landing pages
- **Caching**: Salon data, services, and employee info
- **Image Optimization**: Salon and employee photos

### 2. Mobile Experience
- **Progressive Web App**: Mobile-first booking experience
- **Touch Optimization**: Calendar and time picker components
- **Offline Support**: Cache salon info for offline viewing

### 3. Analytics & Tracking
- **Booking Funnel**: Track conversion at each step
- **Salon Performance**: Metrics per salon
- **User Behavior**: Cross-salon user patterns

### 4. Security Considerations
- **Slug Validation**: Prevent salon slug conflicts
- **Rate Limiting**: Booking attempt limitations
- **CSRF Protection**: Secure booking submissions
- **Data Privacy**: User data isolation per salon

## Migration Strategy

### 1. Backward Compatibility
- **Existing Users**: Migrate current CLIENT users to user_salons
- **Current Bookings**: Maintain existing reservation structure
- **Admin Interface**: Keep admin functionality unchanged

### 2. Gradual Rollout
- **Phase Testing**: Test each phase with limited salons
- **Feature Flags**: Toggle new flow vs old flow
- **Monitoring**: Track errors and performance issues

### 3. Data Migration
```sql
-- Migrate existing CLIENT users to user_salons
-- Assuming they belong to the first/default salon
INSERT INTO user_salons (user_id, salon_id, registered_at)
SELECT id, 1, created_at 
FROM users 
WHERE role = 'CLIENT';
```

## Success Metrics

### 1. User Experience
- **Booking Completion Rate**: % of users who complete full flow
- **Time to Book**: Average time from landing to confirmation
- **User Return Rate**: % of users who book again

### 2. Business Metrics
- **Salon Onboarding**: Ease of adding new salons
- **Cross-Salon Usage**: Users booking multiple salons
- **Mobile Conversion**: Mobile vs desktop booking rates

### 3. Technical Metrics
- **Page Load Times**: Salon landing page performance
- **API Response Times**: Booking flow API performance
- **Error Rates**: Failed bookings and authentication

## Risks & Mitigation

### 1. Complex Migration
- **Risk**: Breaking existing functionality
- **Mitigation**: Comprehensive testing, gradual rollout

### 2. User Confusion
- **Risk**: Users not understanding new flow
- **Mitigation**: Clear UX design, progressive disclosure

### 3. Performance Impact
- **Risk**: Slower loading with more complex data
- **Mitigation**: Caching strategy, optimized queries

### 4. SEO Impact
- **Risk**: URL structure changes affecting search rankings
- **Mitigation**: Proper redirects, sitemap updates

## Conclusion

This refactor transforms the application from a generic booking platform to a salon-specific experience that prioritizes user engagement and conversion. The new flow reduces friction by deferring authentication until the user is committed to booking, while the salon-specific URLs create a branded experience for each business.

The phased approach ensures stability during development, while the user-salon association model provides flexibility for future multi-salon features. 