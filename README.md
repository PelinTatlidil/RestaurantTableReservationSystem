# Restaurant Table Reservation System

Restaurant Table Reservation System is a full-stack MERN application for customers to browse restaurant availability and manage reservations, while enabling admins to control reservations, tables, time slots, users, and restaurant metadata.

## Features

- Customer registration, login, profile management, and reservation workflows
- Admin dashboard for managing reservations, tables, time slots, users, and restaurant information
- Role-based access control for customer and admin capabilities
- Table-selection strategy support for flexible reservation assignment
- Reservation observers for notifications and audit logging
- Facade and proxy patterns to simplify backend workflows and enforce access rules

## Tech Stack

**Frontend**
- React 18
- React Router
- Axios
- Tailwind CSS
- Create React App

**Backend**
- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens
- bcrypt
- Mocha / Chai tests

## Project Structure

```text
RestaurantTableReservationSystem/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── facades/
│   ├── factories/
│   ├── middleware/
│   ├── models/
│   ├── observers/
│   ├── proxies/
│   ├── routes/
│   ├── test/
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   └── package.json
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB (local or hosted)

### Installation

Clone the repository and install dependencies for the root, backend, and frontend:

```bash
git clone https://github.com/PelinTatlidil/RestaurantTableReservationSystem.git
cd RestaurantTableReservationSystem
npm run install-all
```

### Environment Variables

Create `backend/.env` with the values appropriate for your MongoDB deployment:

```env
MONGO_URI=<YOUR_MONGODB_CONNECTION_STRING>
JWT_SECRET=<YOUR_JWT_SECRET>
PORT=5000
```

### Run Locally

Start both the backend API and frontend development server:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

### Production Start

Run the backend production server and frontend together:

```bash
npm start
```

## Available Scripts

From the project root:

```bash
npm run install-all
npm run dev
npm start
```

Additional commands:

```bash
cd backend
npm test
```

## Public Deployment

- Frontend public URL: `http://52.65.216.208`
- Backend API URL: `http://52.65.216.208/api`

## User Roles

### Customer

Customers can:
- Register, log in, and update their profile
- View restaurant information and availability
- Make reservations
- View, update, and cancel their reservations

### Admin

Admins can:
- Log in to the admin dashboard
- Manage reservations and reservation status
- Manage tables and time slots
- Manage users
- Update restaurant information

## Built-In Test Users

| Role     | Email                          | Password |
| -------- | ------------------------------ | -------- |
| Customer | `test@test.com`                | `1234`   |
| Admin    | `pelintatlidil@hotmail.com`    | `1234`   |

> Use the admin login to access the admin dashboard.

## Architecture & Design Patterns

The backend implements several object-oriented patterns:

- Factory: central user creation via a user factory
- Singleton: shared MongoDB connection instance
- Middleware / Chain of Responsibility: authentication, authorization, and ownership checks
- Proxy: access control proxy for role-based resource access
- Strategy: interchangeable table-selection strategies
- Observer: notifications and audit logging on reservation events
- Facade: simplified controller-facing APIs for reservation and management logic

## Core Workflows

- Customers register and log in to access the reservation system
- Customers check availability and create reservations
- Reservation assignment uses strategy-based table selection
- Admins manage tables, slots, users, and restaurant information
- Reservation changes notify observers and record audits

## API Overview

Base URL:

```text
http://localhost:5000/api
```

### Authentication

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Authenticate customer or admin
- `GET /api/auth/profile` — Get authenticated user profile
- `PUT /api/auth/profile` — Update authenticated user profile

### Reservations

- `GET /api/reservations` — List reservations
- `POST /api/reservations` — Create reservation
- `GET /api/reservations/:id` — Get reservation detail
- `PUT /api/reservations/:id` — Update reservation
- `DELETE /api/reservations/:id` — Cancel reservation

### Restaurant Info

- `GET /api/restaurant-info` — Get restaurant information
- `PUT /api/restaurant-info` — Update restaurant information

### Tables

- `GET /api/tables` — List tables
- `POST /api/tables` — Create table
- `PUT /api/tables/:id` — Update table
- `DELETE /api/tables/:id` — Remove table

### Time Slots

- `GET /api/time-slots` — List time slots
- `POST /api/time-slots` — Create time slot
- `PUT /api/time-slots/:id` — Update time slot
- `DELETE /api/time-slots/:id` — Delete time slot

### Users

- `GET /api/users` — List users
- `GET /api/users/:id` — Get user details
- `PUT /api/users/:id` — Update a user
- `DELETE /api/users/:id` — Delete a user

> Protected routes require:
> `Authorization: Bearer <token>`

## Testing

Run backend tests:

```bash
cd backend
npm test
```

## Notes

- The frontend is built with Create React App and Tailwind CSS.
- The backend uses JWT authentication and role-based middleware.
- Reservation state changes are audited and can trigger customer notifications.
- Admin accounts must be used to access dashboard management features.

## License

ISC
