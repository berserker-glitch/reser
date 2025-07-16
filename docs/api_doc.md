# API Documentation

This document provides a detailed overview of the API endpoints for the Salon Reservation System.

---

## Table of Contents

1.  [Authentication](#authentication)
2.  [Services](#services)
3.  [Employees](#employees)
4.  [Working Hours](#working-hours)
5.  [Holidays](#holidays)
6.  [Availability](#availability)
7.  [Reservations](#reservations)
8.  [Admin Dashboard](#admin-dashboard)

---

## 1. Authentication

Handles user registration, login, and profile management.

-   **Controller File**: `backend/app/Http/Controllers/API/AuthController.php`

### POST `/api/auth/register`

-   **Description**: Registers a new user (client or owner).
-   **Request Body**:
    -   `full_name` (string, required): User's full name.
    -   `email` (string, required, unique): User's email address.
    -   `password` (string, required, min: 8, confirmed): User's password.
    -   `password_confirmation` (string, required): Confirmation of the password.
    -   `phone` (string, optional): User's phone number.
    -   `role` (string, optional, `OWNER` or `CLIENT`): Defaults to `CLIENT`.
-   **Success Response** (`201 Created`):
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "user": { ... },
      "authorization": {
        "token": "jwt-token",
        "type": "bearer",
        "expires_in": 3600
      }
    }
    ```
-   **Error Response** (`422 Unprocessable Entity`): For validation errors.

### POST `/api/auth/login`

-   **Description**: Authenticates a user and returns a JWT token.
-   **Request Body**:
    -   `email` (string, required): User's email.
    -   `password` (string, required): User's password.
-   **Success Response** (`200 OK`): Returns user and token information.
-   **Error Response** (`401 Unauthorized`): For invalid credentials.

### POST `/api/auth/logout`

-   **Description**: Logs out the authenticated user by invalidating the token.
-   **Middleware**: `auth:api`
-   **Success Response** (`200 OK`): `{ "success": true, "message": "Successfully logged out" }`

### GET `/api/auth/me`

-   **Description**: Retrieves the profile of the currently authenticated user.
-   **Middleware**: `auth:api`
-   **Success Response** (`200 OK`): Returns the user object.

### PUT `/api/auth/profile`

-   **Description**: Updates the profile of the currently authenticated user.
-   **Middleware**: `auth:api`
-   **Request Body**:
    -   `full_name` (string, optional)
    -   `phone` (string, optional)
-   **Success Response** (`200 OK`): Returns the updated user object.

---

## 2. Services

Manages salon services. Public endpoint for listing, but CRUD is for owners only.

-   **Controller File**: `backend/app/Http/Controllers/API/ServiceController.php`

### GET `/api/services`

-   **Description**: (Public) Retrieves a list of all services and the employees who provide them.
-   **Success Response** (`200 OK`): An array of service objects.

### GET `/api/admin/services`

-   **Description**: (Owner only) Retrieves a list of all services. Can be searched and sorted.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Query Parameters**:
    -   `search` (string, optional): Filter by name or description.
    -   `sort_by` (string, optional, `name`, `price_dhs`, `duration_min`): Defaults to `name`.
    -   `sort_direction` (string, optional, `asc`, `desc`): Defaults to `asc`.
-   **Success Response** (`200 OK`): An array of service objects.

### POST `/api/admin/services`

-   **Description**: (Owner only) Creates a new service.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Request Body**:
    -   `name` (string, required, unique)
    -   `description` (string, optional)
    -   `duration_min` (integer, required, min: 15)
    -   `price_dhs` (numeric, required, min: 0)
-   **Success Response** (`201 Created`): The newly created service object.

### GET `/api/admin/services/{service}`

-   **Description**: (Owner only) Retrieves a single service by its ID.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Success Response** (`200 OK`): The service object.

### PUT `/api/admin/services/{service}`

-   **Description**: (Owner only) Updates an existing service.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Request Body**: Same as POST request, but fields are optional.
-   **Success Response** (`200 OK`): The updated service object.

### DELETE `/api/admin/services/{service}`

-   **Description**: (Owner only) Deletes a service if it has no active reservations.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Success Response** (`200 OK`): `{ "message": "Service deleted successfully" }`
-   **Error Response** (`422 Unprocessable Entity`): If the service has reservations.

---

## 3. Employees

Manages employees. Client-facing endpoint is read-only. CRUD is for owners.

-   **Controller File**: `backend/app/Http/Controllers/API/EmployeeController.php`

### GET `/api/employees`

-   **Description**: (Client) Retrieves a list of employees, often filtered by a service.
-   **Middleware**: `auth:api`
-   **Query Parameters**:
    -   `service_id` (integer, optional)
-   **Success Response** (`200 OK`): An array of employee objects.

### POST `/api/admin/employees`

-   **Description**: (Owner only) Creates a new employee.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Request Body**:
    -   `full_name` (string, required)
    -   `phone` (string, optional)
    -   `note` (string, optional)
    -   `service_ids` (array of integers, optional): Services the employee can perform.
-   **Success Response** (`201 Created`): The new employee object.

### PUT `/api/admin/employees/{employee}`

-   **Description**: (Owner only) Updates an employee's details and assigned services.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Request Body**:
    -   Fields from POST are optional.
    -   `profile_picture` (file, optional): A valid image file (jpeg, png, gif, webp) up to 5MB.
-   **Success Response** (`200 OK`): The updated employee object.

### DELETE `/api/admin/employees/{employee}/profile-picture`

-   **Description**: (Owner only) Removes an employee's profile picture.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Success Response** (`200 OK`): `{ "success": true, "message": "Profile picture removed successfully" }`

---

## 4. Working Hours

Manages when employees work. These are now global settings.

-   **Modification File**: `backend/routes/api.php` (for closures), `backend/app/Http/Controllers/API/WorkingHourController.php` (for admin resource)

### GET `/api/my-working-hours`

-   **Description**: (Authenticated) Retrieves the global working hours schedule for the salon.
-   **Middleware**: `auth:api`
-   **Success Response** (`200 OK`): `{ "success": true, "working_hours": [...] }`

### PUT `/api/my-working-hours`

-   **Description**: (Authenticated) Updates the global working hours for the entire salon. This replaces all existing hours.
-   **Middleware**: `auth:api`
-   **Request Body**: An array of working hour objects.
    ```json
    {
      "working_hours": [
        { "weekday": 0, "start_time": null, "end_time": null, ... },
        { "weekday": 1, "start_time": "09:00", "end_time": "18:00", ... }
      ]
    }
    ```
-   **Success Response** (`200 OK`): `{ "success": true, "message": "Working hours updated successfully" }`

### GET `/api/working-hours`

-   **Description**: (Public) A public endpoint that dynamically generates a full weekly schedule (9-5, Mon-Sat) for every employee. Useful for frontend display.
-   **Success Response** (`200 OK`): An array of employee objects, each with a full `schedule`.

---

## 5. Holidays

-   **Modification File**: `backend/routes/api.php`

### GET `/api/holidays`

-   **Description**: (Authenticated) Retrieves a list of public holidays for a given year.
-   **Middleware**: `auth:api`
-   **Query Parameters**:
    -   `year` (integer, optional): The year to fetch holidays for. Defaults to the current year.
-   **Success Response** (`200 OK`): An array of holiday objects.

---

## 6. Availability

-   **Controller File**: `backend/app/Http/Controllers/API/AvailabilityController.php`

### GET `/api/availability`

-   **Description**: (Authenticated) Gets all available time slots for a given service and date.
-   **Middleware**: `auth:api`
-   **Query Parameters**:
    -   `service_id` (integer, required)
    -   `employee_id` (integer, optional)
    -   `date` (string `YYYY-MM-DD`, optional): Defaults to today.
-   **Success Response** (`200 OK`): `{ "success": true, "data": { "slots": ["..."] } }`

---

## 7. Reservations

-   **Controller File**: `backend/app/Http/Controllers/API/ReservationController.php`

### GET `/api/reservations`

-   **Description**: (Authenticated) Lists reservations. Clients see their own; owners can filter to see all.
-   **Middleware**: `auth:api`
-   **Query Parameters (Owner only)**:
    -   `client_id` (integer, optional)
    -   `employee_id` (integer, optional)
    -   `status` (string, optional)
    -   `date` (string `YYYY-MM-DD`, optional)
-   **Success Response** (`200 OK`): Paginated list of reservation objects.

### POST `/api/reservations`

-   **Description**: (Authenticated) Creates a new reservation.
-   **Middleware**: `auth:api`
-   **Request Body**:
    -   `service_id` (integer, required)
    -   `employee_id` (integer, optional): If omitted, an available employee is assigned automatically.
    -   `start_at` (string `YYYY-MM-DDTHH:mm:ssZ`, required)
-   **Success Response** (`201 Created`): The new reservation object.
-   **Error Response** (`409 Conflict`): If the slot is no longer available.

### GET, PUT, DELETE `/api/reservations/{reservation}`

-   **Description**: Standard RESTful actions for a specific reservation. Access is controlled by `ReservationPolicy`.
-   **Middleware**: `auth:api`

---

## 8. Admin Dashboard

-   **Modification File**: `backend/routes/api.php`

### GET `/api/admin/dashboard/stats`

-   **Description**: (Owner only) Retrieves key statistics for the admin dashboard.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Success Response** (`200 OK`): An object with stats like `total_reservations`, `total_employees`, etc.

### GET `/api/admin/dashboard/revenue-chart`

-   **Description**: (Owner only) Retrieves data formatted for a revenue chart.
-   **Middleware**: `auth:api`, `role:OWNER`
-   **Success Response** (`200 OK`): An object with `labels` and `data` for the chart. 