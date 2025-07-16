# 💇‍♀️ Salon Reservation System 💇‍♂️

<p align="center">
  <strong>An MVP for a modern, single-location Moroccan hair salon.</strong>
</p>

<p align="center">
  <img alt="Laravel" src="https://img.shields.io/badge/Laravel-10-orange?style=for-the-badge&logo=laravel"/>
  <img alt="React" src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react"/>
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-8-blue?style=for-the-badge&logo=mysql"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript"/>
  <img alt="Chakra UI" src="https://img.shields.io/badge/Chakra%20UI-2.8-teal?style=for-the-badge&logo=chakraui"/>
</p>

---

## ✨ Overview

This project is a **M**inimum **V**iable **P**roduct for a salon reservation system, tailored for single-location Moroccan hair salons. It provides a seamless experience for both salon owners and clients. Owners can manage their business operations, while clients can easily book their next appointment.

## 🚀 Key Features

-   **👤 User Roles**: Separate interfaces and functionalities for **Salon Owners** and **Clients**.
-   **🔐 Authentication**: Secure JWT-based authentication for both API and frontend.
-   **🏢 Owner Dashboard**:
    -   Full CRUD (Create, Read, Update, Delete) for **Employees**.
    -   Full CRUD for **Services** offered by the salon.
    -   Manage salon-wide **Working Hours**.
    -   View and manage all client **Reservations**.
-   **💻 Client Booking Flow**:
    -   User registration and login.
    -   Browse available services.
    -   Optionally select a preferred employee.
    -   An intelligent calendar that shows the **nearest available slots**.
    -   View booking history.
-   **🇲🇦 Holiday-Aware**: The system automatically fetches and blocks Moroccan public holidays using the [Nager.Date API](https://date.nager.at/).
-   **📱 Responsive Design**: A mobile-first, responsive interface built with Chakra UI.

## 🛠️ Tech Stack

### Backend

-   **Framework**: [Laravel 10](https://laravel.com/) (API-only)
-   **Database**: [MySQL 8](https://www.mysql.com/)
-   **Authentication**: [Tymon JWT-Auth](https://jwt-auth.readthedocs.io/en/develop/)
-   **Task Scheduling**: Native Laravel Scheduler for yearly holiday imports.

### Frontend

-   **Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Library**: [Chakra UI](https://chakra-ui.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
-   **Forms**: [React Hook Form](https://react-hook-form.com/)
-   **HTTP Client**: [Axios](https://axios-http.com/)

## 📸 Screenshots

*A picture is worth a thousand words. Add some screenshots of your application here!*

| Admin Dashboard | Booking Calendar |
| :-------------: | :--------------: |
| _(Add screenshot)_ | _(Add screenshot)_ |

| Mobile View | Services Page |
| :-----------: | :-------------: |
| _(Add screenshot)_ | _(Add screenshot)_ |

## 🏁 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   PHP >= 8.2
-   Composer
-   Node.js & pnpm (or npm/yarn)
-   A MySQL database server

### 1. Backend Setup (Laravel API)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd reserv/backend

# 2. Install PHP dependencies
composer install

# 3. Set up your environment file
# Copy .env.example to .env and fill in your DB_DATABASE, DB_USERNAME, DB_PASSWORD
cp .env.example .env
php artisan key:generate

# 4. Generate a JWT secret key
php artisan jwt:secret

# 5. Run database migrations and seeders
# This will create the tables and populate them with initial data
php artisan migrate --seed

# 6. Import public holidays for the current year
php artisan holidays:import

# 7. Start the development server
php artisan serve
# The API will be running at http://127.0.0.1:8000
```

### 2. Frontend Setup (React App)

```bash
# 1. Navigate to the frontend directory
cd ../frontend

# 2. Install Node.js dependencies (using pnpm is recommended)
pnpm install
# or: npm install

# 3. Start the development server
pnpm run dev
# or: npm run dev

# 4. Open your browser and navigate to http://localhost:5173 (or the port shown in the terminal)
```

## 📄 API Documentation

A complete documentation of all available API endpoints, including parameters and responses, is available in the `docs/` directory.

➡️ **[View Full API Documentation](./docs/api_doc.md)**

## 📂 Project Structure

The project maintains a clean separation between the frontend and backend concerns.

```
reserv/
├── backend/        # Laravel API
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   └── ...
├── frontend/       # React + Chakra UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── ...
│   └── ...
├── docs/           # Project documentation
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss what you would like to change or submit a pull request.

## 📜 License

This project is licensed under the MIT License - see the `LICENSE` file for details. 