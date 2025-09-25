# ExpenseTracker - FastAPI & React Expense Management System

A comprehensive expense tracking application with secure authentication, expense management, budgeting, reporting, and visualization features.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Security Features](#security-features)
- [Budget Management](#budget-management)
- [Logging System](#logging-system)
- [Account Reactivation](#account-reactivation)
- [License](#license)

## Features

### Authentication & Security
- 🔐 Two-factor authentication (2FA) with Google Authenticator and email verification
- 📧 Email verification for registration and login
- 🔒 JWT token-based authentication with secure session management
- 🔑 Secure password hashing with Passlib
- ⚙️ OAuth2 with Google integration
- ♻️ Account reactivation for deactivated accounts

### Expense Management
- 💰 Add, view, and manage expenses with detailed descriptions
- 📂 Custom category creation and management
- 💳 Multiple payment method support
- 📅 Date-based expense tracking with datetime functionality
- ✏️ Edit and update existing expenses
- 🗑️ Delete expenses when needed

### Budget Management
- 💵 Set monthly budgets for specific categories
- 📊 Track budget usage and remaining amounts
- 📈 Visual budget progress indicators
- 🔄 Edit and update existing budgets
- 🗑️ Delete budgets when no longer needed
- 📅 Monthly budget tracking and reporting

### Reporting & Analytics
- 📊 Dashboard with expense summaries and budget tracking
- 📈 Visual expense distribution charts and budget progress
- 📋 Detailed expense lists with filtering and pagination
- 📄 PDF report generation with export functionality
- 📅 Date range filtering for reports and analytics
- 📊 Total expense amount tracking
- 📊 Monthly expense and transaction counts
- 📋 Recent transactions view

### User Profile & Account Management
- 👤 Modern user profile page with statistics
- ⚙️ Account settings for managing personal information
- 🔧 Security settings with 2FA management
- 📅 "Member since" information with days calculation
- 🟢 Online status indicator
- ♻️ Account reactivation for deactivated accounts

### User Experience
- 🌙 Dark/light theme toggle
- 📱 Responsive design for all devices
- 🚀 Fast and intuitive user interface
- 🎨 Modern UI with smooth animations
- 🔄 Real-time data updates

### Logging System
- 📝 Comprehensive logging for all user actions
- 📊 Authentication event logging
- 📋 API request tracking
- 📁 File and database logging
- 🔍 Audit trail for security monitoring

## Tech Stack

### Backend
- **Python 3.9+**
- **FastAPI** - High-performance web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation and settings management
- **PyOTP** - Two-factor authentication implementation
- **Passlib** - Password hashing
- **Alembic** - Database migration tool
- **SMTPLib** - Email sending functionality

### Services
- **AuthService** - User registration, login, and authentication
- **ExpenseService** - Expense creation, management, and categorization
- **AnalyticsService** - Reporting, statistics, and data analysis
- **UserService** - User profile management
- **TwoFaService** - Two-factor authentication management
- **BudgetService** - Budget creation and management
- **EmailService** - Email notification system
- **LoggingService** - Comprehensive logging system

### Frontend
- **React 18** - JavaScript library for building user interfaces
- **React Router** - Declarative routing for React
- **jsPDF** - Client-side PDF generation
- **CSS3** - Modern styling with custom properties
- **React Icons** - Icons for UI components
- **React Charts** - Data visualization libraries

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
│   │   ├── UserController.py      # User profile routes
│   │   ├── BudgetController.py    # Budget management routes
│   │   ├── TwoFAController.py     # Two-factor authentication routes
│   │   ├── LoggingController.py   # Logging system routes
│   │   └── main.py               # Application entry point
│   ├── Models/             # Database models
│   │   ├── User.py         # User model
│   │   ├── Transaction.py  # Expense/transaction model
│   │   ├── Category.py     # Category model
│   │   ├── Budget.py       # Budget model
│   │   └── Logging.py      # Logging model
│   ├── Schema/             # Pydantic data schemas
│   │   ├── AuthSchema.py   # Authentication schemas
│   │   ├── ExpenseSchema.py # Expense schemas
│   │   ├── UserSchema.py   # User schemas
│   │   ├── TwoFaSchema.py  # Two-factor auth schemas
│   │   ├── BudgetSchema.py # Budget schemas
│   │   ├── LoggingSchema.py # Logging schemas
│   │   └── CommonSchema.py # Common schemas
│   ├── Services/           # Business logic implementation
│   │   ├── AuthService.py         # Authentication service
│   │   ├── ExpenseService.py      # Expense management service
│   │   ├── AnalyticsService.py    # Analytics and reporting service
│   │   ├── UserService.py         # User profile service
│   │   ├── TwoFaService.py        # Two-factor authentication service
│   │   ├── BudgetService.py       # Budget management service
│   │   ├── EmailService.py        # Email notification service
│   │   └── LoggingService.py      # Logging system service
│   ├── Interfaces/         # Service interfaces
│   │   ├── IAuthService.py        # Authentication service interface
│   │   ├── IExpenseService.py     # Expense management service interface
│   │   ├── IAnalyticsService.py   # Analytics service interface
│   │   ├── IUserService.py        # User service interface
│   │   ├── ITwoFaService.py       # Two-factor auth service interface
│   │   ├── IBudgetService.py      # Budget service interface
│   │   └── ILoggingService.py     # Logging service interface
│   ├── Factory/            # Service factory patterns
│   ├── OAuthandJWT/        # Authentication utilities
│   ├── PasslibPasswordHash/ # Password hashing utilities
│   ├── TwoFAgoogle/        # Two-factor authentication
│   ├── EmailService/       # Email notification service
│   ├── Logging/            # Logging system
│   │   ├── Helper/         # Logging helpers
│   │   ├── FileAndDbLogging.py # File and database logging
│   │   └── LoggerConfig.py # Logger configuration
│   └── Logging/            # Application logs directory
│
├── Frontend (React)
│   ├── components/         # React components
│   │   ├── auth/           # Authentication components
│   │   │   ├── AccountReactivation.jsx # Account reactivation page
│   │   │   ├── AccountSettings.jsx     # Account settings page
│   │   │   ├── Profile.jsx           # User profile page
│   │   │   ├── Login.jsx             # Login page
│   │   │   ├── Register.jsx          # Registration page
│   │   │   └── AuthContext.jsx       # Authentication context
│   │   ├── utils/          # Utility components
│   │   ├── AddExpense.jsx  # Expense creation form
│   │   ├── BudgetModal.jsx # Budget management modal
│   │   ├── Dashboard.jsx   # Dashboard with overview
│   │   ├── ExpensesList.jsx # Expense listing with filters
│   │   ├── HomePage.jsx    # Landing page
│   │   ├── Navbar.jsx      # Navigation bar
│   │   ├── Reports.jsx     # Reporting with PDF export
│   │   └── Sidebar.jsx     # Sidebar navigation
│   ├── configs/            # Configuration files
│   ├── services/           # API service functions
│   ├── utils/              # Utility functions
│   ├── assets/             # Static assets
│   └── public/             # Public static files
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
- `POST /api/re-active-account` - Request account reactivation code
- `POST /api/re-active-account-verification-email-code` - Verify reactivation code and reactivate account
- `POST /api/google-register` - Google OAuth registration
- `POST /api/google-callback` - Google OAuth callback
- `POST /api/change-password` - Change user password

### Expenses
- `POST /api/expenses` - Add new expense
- `GET /api/expenses` - Get all expenses for user
- `PUT /api/expenses` - Edit existing expense
- `POST /api/categories` - Add new category
- `GET /api/categories` - Get all categories for user

### Analytics
- `GET /api/total_amount` - Get total expense amount
- `GET /api/monthly_total` - Get monthly expense total
- `GET /api/monthly_transactions` - Get monthly transaction count
- `GET /api/total_transactions` - Get total transaction count
- `GET /api/recent_transactions` - Get recent transactions

### Budget Management
- `POST /api/budgets` - Add new budget for a category
- `GET /api/budgets` - Get all budgets for user
- `PUT /api/budgets` - Edit existing budget amount
- `DELETE /api/budgets/{category_id}` - Delete a specific budget
- `GET /api/monthly-budget-total` - Get total budget amount for a month

### Two-Factor Authentication
- `POST /api/enable-2fa` - Enable 2FA for user
- `POST /api/disable-2fa` - Disable 2FA for user
- `POST /api/verify-2fa` - Verify 2FA code during login

### User Profile
- `GET /api/user_details` - Get user profile information
- `PUT /api/user_profile` - Update user profile information

### Logging
- `GET /api/user-auth-logs` - Get authentication logs for user
- `GET /api/user-action-logs` - Get action logs for user

## Frontend Components

### Authentication System
- **AuthContext** - Authentication context provider for state management
- **Login** - Secure login with 2FA and account reactivation option
- **Register** - User registration with email verification and account reactivation during registration
- **AccountReactivation** - Dedicated page for account reactivation
- **Profile** - User profile with statistics and account information
- **AccountSettings** - Account management and security settings

### Main Application
- **Navbar** - Navigation with theme toggle, user menu, and responsive design
- **Sidebar** - Sidebar navigation with application links
- **Dashboard** - Overview with expense summaries, budget tracking, and charts
- **AddExpense** - Form for adding new expenses with category selection and payment methods
- **ExpensesList** - Detailed expense listing with filtering, sorting, and editing capabilities
- **BudgetModal** - Modal for setting and managing budgets per category
- **Reports** - Advanced reporting with PDF export, date filtering, and analytics
- **HomePage** - Landing page with application overview and features

### Utility Components
- **Auth** - Authentication-related styling and UI elements
- **utils** - Utility functions and helper components
- **assets** - Static images, icons, and other assets

## Security Features

### Two-Factor Authentication
- Google Authenticator integration
- Email code verification
- QR code setup for new users
- Secure token generation and validation

### Data Protection
- Password hashing with Passlib
- JWT token authentication with expiration
- Secure session management
- SQL injection prevention with SQLAlchemy ORM
- Input validation and sanitization
- Secure API endpoint protection

### Communication Security
- HTTPS-ready implementation
- Secure headers configuration
- Encrypted data transmission
- Protected API endpoints with authentication

## Budget Management

The ExpenseTracker application includes comprehensive budget management functionality to help users control their spending:

### Features
- Set monthly budgets for specific expense categories
- Track budget usage in real-time
- Visual indicators showing budget progress
- Monthly budget tracking and reporting
- Budget editing and deletion capabilities

### How It Works
1. **Budget Setting**: Users can set budget amounts for specific categories each month
2. **Expense Tracking**: The system tracks expenses against budgets automatically
3. **Progress Visualization**: Dashboard shows visual indicators of budget usage
4. **Monthly Reset**: Budgets can be managed on a monthly basis

## Logging System

The application features a comprehensive logging system that tracks all user activities and system events:

### Features
- File-based logging with rotation
- Database logging for persistent storage
- User action tracking
- Authentication event logging
- API request logging
- Error and exception logging
- IP address tracking
- Audit trail creation

### Implementation
- Both file and database logging simultaneously
- Automatic log rotation to manage storage
- Structured logging with event sources
- User ID tracking for all actions
- Exception handling with detailed logs

## Account Reactivation

The ExpenseTracker application now includes account reactivation functionality for users with deactivated accounts. This feature allows users to restore access to their accounts without needing to create a new one.

### How It Works

1. **Detection**: When a user attempts to log in or register with an email associated with a deactivated account, the system automatically detects this condition.

2. **Reactivation Options**: 
   - Users can reactivate their account directly from the login page
   - Users can also reactivate during the registration process if they attempt to register with a deactivated email

3. **Verification Process**:
   - System sends a verification code to the user's email
   - User enters the code to verify their identity
   - Account is reactivated upon successful verification

4. **Post-Reactivation**:
   - Users can immediately log in with their existing credentials
   - All previous data and settings are preserved
   - Account status is updated to active

### Benefits

- **Data Preservation**: Users retain all their previous expense data, categories, and settings
- **Seamless Experience**: Simple verification process with email code
- **Security**: Maintains the same security standards as regular authentication
- **Flexibility**: Available from both login and registration flows

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.