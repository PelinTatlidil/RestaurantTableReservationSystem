# Restaurant Table Reservation System
 TEST
## Project Overview

This project is a Restaurant Table Reservation System. It allows customers to register, log in, make table reservations, view their reservations, update reservations, and cancel reservations. It also allows the admin user to manage reservations, tables, and dashboard information.

## User Roles

The system has two main user roles:

- Customer: can register, log in, view restaurant information, check availability, make reservations, view their own reservations, update reservations, cancel reservations, and update their profile.
- Admin: can log in to the admin dashboard and manage reservations, update reservation status, manage tables, manage time slots, manage users, and update restaurant information.
## Backend Design Patterns

The backend demonstrates several object-oriented design patterns to keep the reservation system organized, reusable, and easier to maintain.

- Factory: user creation is centralized through a user factory so customer and admin accounts are created through controlled methods.
- Singleton: the MongoDB connection is managed through a single shared database connection instance.
- Middleware / Chain of Responsibility: Express requests pass through authentication, role-checking, and ownership-checking middleware before reaching controller logic.
- Proxy: access-control proxy logic filters sensitive data and restricts operations based on user role and resource ownership.
- Strategy: table selection can switch between different table-selection strategies without changing the reservation controller workflow.
- Observer: reservation status changes notify registered observers, such as customer notification and audit logging observers.
- Facade: controller-level methods provide simplified entry points for reservation, table, and user operations by hiding lower-level model and validation details.

## Public URL

Frontend public URL:

http://52.65.216.208

Backend API URL:

http://52.65.216.208/api



## Test Login Details

Customer login:

Email: test@test.com     
Password: 1234

Admin login:

Email: pelintatlidil@hotmail.com  
Password: 1234

Please use the admin login to access the admin dashboard.

## Project Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/PelinTatlidil/RestaurantTableReservationSystem.git
cd RestaurantTableReservationSystem
