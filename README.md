# ET-FastApi - Expense Tracker API

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

ET-FastApi is a comprehensive expense tracking application built with FastAPI. This RESTful API provides complete functionality for managing personal finances, including user authentication, expense tracking, budget management, analytics, and more. The application follows modern API design principles with security, performance, and scalability in mind.

## Features

### 1. User Authentication

- **Registration & Login**: Secure user registration and login with email verification
- **Multi-factor Authentication**: Optional Two-Factor Authentication (2FA) using Google Authenticator
- **Social Authentication**: Google OAuth 2.0 integration for easy sign-in
- **Token-Based Security**: JWT (JSON Web Token) based authentication system
- **Account Management**: Account deletion and reactivation functionality
- **Password Management**: Secure password change with Argon2 hashing

### 2. Expense Management

- **Add Expenses**: Create new expense entries with amount, date, description, and category
- **Expense Categories**: Create and manage custom expense categories
- **View Expenses**: Retrieve and paginate expense history
- **Bulk Operations**: Edit or delete multiple expenses at once

### 3. Budget Management

- **Set Budgets**: Define budget limits for specific categories
- **Monthly Budgets**: Set different budgets for different months
- **Budget Tracking**: Compare actual spending against set budgets
- **Budget Management**: Edit or delete existing budgets

### 4. Analytics & Reporting

- **Total Spending**: Calculate total amount spent over time
- **Monthly Analytics**: Retrieve monthly expense totals and transaction counts
- **Recent Transactions**: Get recent transactions for quick overview
- **Budget vs Actual**: Compare budget amounts against actual spending
- **PDF Reports**: Generate expense reports in PDF format

### 5. User Management

- **Profile Management**: Retrieve user profile information
- **Contact System**: Contact form for user support
- **Activity Logging**: Track user authentication activities

### 6. Security Features

- **Session Management**: Secure session handling with middleware
- **Rate Limiting**: Protection against excessive API requests
- **Secure Passwords**: Passlib Argon2 password hashing

### 7. Performance & Caching

- **Redis Caching**: Implemented Redis for caching frequently accessed data
- **Cache Invalidation**: Smart cache invalidation when data changes
- **Optimized Queries**: Efficient database queries with proper indexing

## Technology Stack

### Backend Framework

- **FastAPI**: Modern, fast (high-performance) web framework for building APIs with Python 3.7+
- **SQLAlchemy**: Python SQL toolkit and Object Relational Mapping (ORM)
- **Pydantic**: Data validation and settings management using Python type hints

### Database

- **PostgreSQL**: Advanced open-source database with robust transaction support

### Authentication & Security

- **JWT (JSON Web Tokens)**: Token-based authentication
- **Argon2**: Secure password hashing algorithm
- **Passlib**: Password hashing library
- **OAuth 2.0**: Google OAuth integration for social authentication
- **PyOTP**: One-time password implementation for 2FA

### Caching & Performance

- **Redis**: In-memory data structure store for caching
- **Session Middleware**: Secure session handling

### Development & Testing

- **Pytest**: Testing framework for Python
- **Alembic**: Database migration tool
- **Python-dotenv**: Manage environment variables

### Deployment

- **Vercel**: Platform for frontend and serverless functions
- **Uvicorn**: Lightning-fast ASGI server implementation

## Architecture

ET-FastApi follows a clean architecture pattern with the following components:

### 1. Controllers Layer

- **AuthController**: Handles user authentication, registration, and account management
- **ExpenseController**: Manages expense-related operations
- **BudgetController**: Handles budget management functionality
- **AnalyticsController**: Provides analytics and reporting features
- **UserController**: Manages user profile and contact forms
- **TwoFAController**: Implements two-factor authentication features
- **LoggingController**: Tracks user authentication logs
- **PdfController**: Generates expense reports in PDF format
- **WebhooksController**: Handles webhook functionality

### 2. Services Layer

- **IService Interfaces**: Abstract service interfaces defining contracts
- **Concrete Service Implementations**: Business logic implementations
- **Dependency Injection**: Services are injected using FastAPI's dependency system

### 3. Factory Pattern

- **AbstractFactory**: Implements factory pattern for service creation
- **Registry Factory**: Centralized service registry and creation

### 4. Data Layer

- **Models**: SQLAlchemy ORM models representing database tables
- **Schemas**: Pydantic models for request/response validation
- **Database Connection**: SQLAlchemy database session management

### 5. Caching Layer

- **Redis Cache**: In-memory caching for performance optimization
- **Cache Strategies**: Smart caching with appropriate expiration and invalidation

## API Endpoints

### Authentication (`/api` prefix)

- `POST /register` - User registration with optional 2FA
- `POST /login` - User login with email verification and 2FA
- `GET /register_via_google` - Initiate Google OAuth registration
- `GET /callback` - Handle Google OAuth callback
- `POST /google_oauth_cred` - Handle Google OAuth from frontend
- `GET /verify-token` - Verify JWT token
- `DELETE /delete-account` - Delete user account
- `POST /re-active-account` - Reactivate account
- `POST /re-active-account-verification-email-code` - Verify reactivation code
- `POST /change-password` - Change user password
- `GET /RegistrationVerificationEmailCodeAnd2FAOtp` - Verify registration code and OTP
- `GET /LoginVerificationEmailCodeAnd2FAOtp` - Verify login code and OTP

### Expenses (`/api` prefix)

- `POST /expenses` - Add new expense
- `GET /expenses` - Get user expenses with pagination
- `POST /categories` - Create expense category
- `GET /categories` - Get user categories
- `POST /edit_expense_list` - Bulk edit expenses
- `DELETE /delete_expense_list_item` - Delete individual expense item

### Budgets (`/api` prefix)

- `POST /add-budget` - Set budget for category and month
- `GET /budgets` - Get budgets for specific month
- `GET /total-set-budget-amount-according-to-month` - Get monthly budget total
- `POST /Edit_budget_amount` - Update budget amount
- `DELETE /delete_set_budget` - Remove budget

### Analytics (`/api` prefix)

- `GET /total_amount` - Get total expenses amount
- `GET /monthly_total` - Get total expenses for specific month/year
- `GET /total_transactions` - Get total number of transactions
- `GET /monthly_transactions` - Get transaction count for specific month/year
- `GET /recent_transactions` - Get recent transactions
- `GET /budget-against-transactions` - Compare budget vs actual spending

### Two-Factor Authentication (`/api` prefix)

- `POST /2fa_enable` - Enable 2FA for user
- `POST /2fa_disable` - Disable 2FA for user
- `POST /verify_2fa` - Verify 2FA OTP after enabling

### User Management (`/api` prefix)

- `GET /user_details` - Get user profile information
- `POST /contact` - Submit contact message

### Logging (`/api` prefix)

- `GET /auth_logging` - Get user authentication logs
- `GET /return_selected_logging` - Get specific logging information

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- PostgreSQL database
- Redis server
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/ET-FastApi.git
   cd ET-FastApi
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the project root with the required variables (see [Environment Variables](#environment-variables) section)

5. **Run database migrations**

   ```bash
   alembic upgrade head
   ```

6. **Start the development server**
   ```bash
   uvicorn main:app --reload
   ```

### Running the Application

- **Development mode**: `uvicorn main:app --reload`
- **Production mode**: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Running Tests

```bash
pytest
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
CLIENT_ID=YOUR_GOOGLE_CONSOLE_CLIENT_ID
CLIENT_SECRET=YOUR_GOOGLE_CONSOLE_CLIENT_SECRET
REDIRECT_URI=http://127.0.0.1:8000/api/callback #or prod redirectUrl

SECRET_KEY=YOUR_SECRET_KEY

#SMPT Credentials
FROM_ADDRESS=YOUR_FROM_ADDRESS(YOUR_EMAIL)
SMPT_SERVER=YOUR_SMPT_SERVER(smtp.gmail.com)
PORT=587
GOOGLEUSERNAME=YOUR_GOOGLEUSERNAME(EMAIL)
PASSWORD=YOUR_APP_PASSWORD
ENABLESSL=true

#Env DB's
DATABASE_URL_DEV=YOUR_DEV_DB_URL (Postgress/MySQL)
DATABASE_URL_PROD=YOUR_PROD_DB_URL (Postgress/MySQL)

#Redis Cache
#Local
REDIS_LOCAL_HOST=localhost

#upstash Prod
REDIS_HOST=YOUR_REDIS_HOST
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
REDIS_DB=0

#Webhook Upstash Qstash
UPSTASH_REDIS_URL=YOUR_UPSTASH_REDIS_URL
QSTASH_CURRENT_SIGNING_KEY=YOUR_QSTASH_CURRENT_SIGNING_KEY

# Application Environment
APP_ENV=development  # or 'production'
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel --prod`

COPY requirements.txt .
RUN pip install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/feature-name`
6. Open a pull request

### Code Standards
- Follow PEP 8 Python style guide
- Write tests for new functionality
- Document new endpoints and features
- Use type hints for all functions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)
- [Redis Documentation](https://redis.io/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Note**: This API is part of an expense tracking system and includes security measures such as JWT authentication, secure password hashing, and input validation to protect user data.
```
