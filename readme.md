# Attendance Management System

MetaUpSpace - AMS  
Developed in 2025 to centralize and streamline attendance management for organizations.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Usage Guide](#usage-guide)
- [Functionality Details](#functionality-details)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This Attendance Management System (AMS) is a full-stack web application designed for HR and employees to manage, track, and report attendance, activities, and timesheets. It provides a modern, user-friendly interface and robust backend integration.

---

## Features

- **Authentication**: Secure login for HR and employees.
- **Role-based Access**: HR and Employee dashboards with different permissions.
- **Attendance Tracking**: Check-in, check-out, and agenda management.
- **Employee Management**: HR can add, deactivate, and manage employees.
- **Reports**: Generate and download monthly reports and timesheets.
- **Profile Management**: Employees can update their profile and change passwords.
- **Responsive UI**: Works on desktop and mobile devices.
- **Notifications**: Toasts and alerts for actions and errors.

---

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Radix UI, Chart.js
- **State Management**: React Query
- **Backend**: (API endpoints expected, not included in this repo)
- **Database**: (Expected MongoDB via Mongoose)
- **Other**: Axios, JWT, bcrypt, Puppeteer, PDFKit, PapaParse

---

## Project Structure

```
src/
  app/                # Next.js app directory
    (main)/           # Main application routes
      attendance/     # Attendance features (check-in/out, my attendance)
      hr/             # HR dashboard and management
      profile/        # User profile
    context/          # Auth and error boundary providers
    login/            # Login page and form
    components/       # UI and feature components
    hooks/            # Custom React hooks
    models/           # TypeScript interfaces for data models
    queries/          # API query functions
    schemas/          # Validation schemas
    utils/            # Utility functions
public/               # Static assets
```

---

## Setup & Installation

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- (Optional) Docker

### 1. Clone the Repository

```bash
git clone <repo-url>
cd "Attendance Management"
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add necessary environment variables (API URLs, secrets, etc.).  
_Example:_
```
NEXT_PUBLIC_API_BASE_URL=https://your-api-url.com
JWT_SECRET=your_jwt_secret
```

### 4. (Optional) Docker Setup

If you want to use Docker, build and run the container:

```bash
docker build -t attendance-management .
docker run -p 3000:3000 attendance-management
```

---

## Running the Project

### Development

```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
```

---

## Usage Guide

### Authentication

- **Login**: Go to `/login` and enter your credentials.
- **Roles**: HR and Employee roles are supported, with different dashboard views.

### Attendance

- **Check-In/Out**: Employees can check in and out, select agendas, and provide remarks.
- **My Attendance**: View your attendance history, agendas, and working hours.

### HR Dashboard

- **Employee Management**: Add, deactivate, and manage employees.
- **Reports**: Generate monthly reports and download timesheets.
- **Daily Activities**: View and manage daily activities of employees.

### Profile

- **View/Update Profile**: Employees can update their personal information.
- **Change Password**: Securely change your password.

---

## Functionality Details

### Core Models

- **Employee**: Stores profile, contact, role, and status.
- **Attendance**: Tracks check-in/out times, agendas, remarks, and working minutes.
- **HR**: Manages employees, generates reports, and oversees attendance.

### API Queries

- **Authentication**: Login, logout, refresh token, get current user.
- **Attendance**: Check-in, check-out, fetch records, monthly/daily reports.
- **Employee**: Profile fetch/update, password change.
- **HR**: Employee CRUD, report generation, timesheet download.

### UI Components

- **Reusable UI**: Buttons, dialogs, tables, forms, modals, alerts, toasts.
- **Navigation**: Sidebar and navbar for easy access to features.
- **Charts & Reports**: Visualize attendance and activity data.

---

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a Pull Request.

---

## License

This project is licensed under the MIT License.

---

**For any issues or feature requests, please open an issue on the repository.**
