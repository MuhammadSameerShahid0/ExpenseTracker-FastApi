# ExpenseTracker - FastAPI & React Expense Management System

A comprehensive expense tracking application with secure authentication, expense management, reporting, and visualization features.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Security Features](#security-features)
- [License](#license)

## Features

### Authentication & Security
- 🔐 Two-factor authentication (2FA) with Google Authenticator
- 📧 Email verification for registration and login
- 🔒 JWT token-based authentication
- 🔑 Secure password hashing with Passlib

### Expense Management
- 💰 Add, view, and manage expenses
- 📂 Custom category creation and management
- 💳 Multiple payment method support
- 📅 Date-based expense tracking

### Reporting & Analytics
- 📊 Dashboard with expense summaries
- 📈 Visual expense distribution charts
- 📋 Detailed expense lists with filtering
- 📄 PDF report generation with export functionality
- 📅 Date range filtering for reports

### User Experience
- 🌙 Dark/light theme toggle
- 📱 Responsive design for all devices
- 🚀 Fast and intuitive user interface
- 🎨 Modern UI with smooth animations

## Tech Stack

### Backend
- **Python 3.9+**
- **FastAPI** - High-performance web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation and settings management
- **PyOTP** - Two-factor authentication implementation
- **Passlib** - Password hashing
- **Alembic** - Database migration tool

### Services
- **AuthService** - User registration, login, and authentication
- **ExpenseService** - Expense creation, management, and categorization
- **AnalyticsService** - Reporting, statistics, and data analysis

### Frontend
- **React 18** - JavaScript library for building user interfaces
- **React Router** - Declarative routing for React
- **jsPDF** - Client-side PDF generation
- **CSS3** - Modern styling with custom properties

### Database
- **MySQL** - Relational database management system

### Development Tools
- **Vite** - Fast build tool
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting

## Architecture

The application follows a clean architecture pattern with clear separation of concerns:

```
ExpenseTracker/
├── Backend (FastAPI)
│   ├── Controllers/        # API route handlers
│   │   ├── AuthController.py      # Authentication routes
│   │   ├── ExpenseController.py   # Expense management routes
│   │   ├── AnalyticsController.py # Analytics and reporting routes
│   │   └── main.py               # Application entry point
│   ├── Models/             # Database models
│   ├── Schema/             # Pydantic data schemas
│   ├── Services/           # Business logic implementation
│   │   ├── AuthService.py         # Authentication service
│   │   ├── ExpenseService.py      # Expense management service
│   │   └── AnalyticsService.py    # Analytics and reporting service
│   ├── Interfaces/         # Service interfaces
│   │   ├── IAuthService.py        # Authentication service interface
│   │   ├── IExpenseService.py     # Expense management service interface
│   │   └── IAnalyticsService.py   # Analytics service interface
│   ├── Factory/            # Service factory patterns
│   ├── OAuthandJWT/        # Authentication utilities
│   ├── PasslibPasswordHash/ # Password hashing utilities
│   ├── TwoFAgoogle/        # Two-factor authentication
│   └── EmailService/       # Email notification service
```

## Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- MySQL database
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ExpenseTracker
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
# Create .env file with your configuration
DATABASE_URL=mysql://username:password@localhost:3306/expense_tracker
JWT_SECRET_KEY=your-secret-key
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@example.com
EMAIL_PASSWORD=your-email-password
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the backend server:
```bash
uvicorn main:app --reload
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd expense-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
ExpenseTracker/
├── alembic/                # Database migration files
├── Controllers/            # FastAPI route controllers
├── Factory/                # Service factory implementations
├── Interfaces/             # Abstract service interfaces
├── Models/                 # Database models and schemas
├── OAuthandJWT/            # Authentication and JWT utilities
├── PasslibPasswordHash/    # Password hashing utilities
├── Schema/                 # Pydantic data validation schemas
├── Services/               # Business logic services
├── TwoFAgoogle/            # Two-factor authentication
├── expense-tracker/        # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── auth/           # Authentication components
│   │   └── assets/         # Static assets
│   └── public/             # Public static files
├── requirements.txt        # Python dependencies
├── alembic.ini            # Alembic configuration
├── .env                   # Environment variables
└── README.md              # Project documentation
```

## API Endpoints

### Authentication
- `POST /api/register` - User registration with 2FA setup
- `POST /api/login` - User login with email verification
- `POST /api/verify-token` - JWT token verification

### Expenses
- `POST /api/expenses` - Add new expense
- `GET /api/expenses` - Get all expenses for user
- `POST /api/categories` - Add new category
- `GET /api/categories` - Get all categories for user

### Analytics
- `GET /api/total_amount` - Get total expense amount
- `GET /api/monthly_total` - Get monthly expense total
- `GET /api/monthly_transactions` - Get monthly transaction count
- `GET /api/total_transactions` - Get total transaction count
- `GET /api/recent_transactions` - Get recent transactions

## Frontend Components

### Authentication
- **Login** - Secure login with 2FA
- **Register** - User registration with email verification

### Main Application
- **Navbar** - Navigation with theme toggle
- **Dashboard** - Overview with statistics and charts
- **AddExpense** - Form for adding new expenses
- **ExpensesList** - Detailed expense listing with filters
- **Reports** - Advanced reporting with PDF export

## Security Features

### Two-Factor Authentication
- Google Authenticator integration
- Email code verification
- QR code setup for new users

### Data Protection
- Password hashing with Passlib
- JWT token authentication
- Secure session management
- SQL injection prevention with SQLAlchemy ORM

### Communication Security
- HTTPS-ready implementation
- Secure headers configuration
- Input validation and sanitization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.