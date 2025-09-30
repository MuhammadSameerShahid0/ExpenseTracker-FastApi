import os

from dotenv import load_dotenv
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from Controllers.AuthController import AuthRouter
from Controllers.BudgetController import BudgetRouter
from Controllers.ExpenseController import ExpenseRouter
from Controllers.AnalyticsController import AnalyticsRouter
from Controllers.LoggingController import LoggingRouter
from Controllers.TwoFAController import TwoFaRouter
from Controllers.UserController import UserRouter

load_dotenv()

app = FastAPI()

origins = [
        "https://expense-tracker-fast-api.vercel.app",
        "https://expense-tracker-python-fast-api.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],  # Or specify headers: ["Content-Type", "Authorization", "Accept"]
    expose_headers=["*"],  # Add this line
    max_age=600,  # Cache preflight response for 10 minutes
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY"),  # must be secure in production
)

app.include_router(AuthRouter, prefix="/api")
app.include_router(ExpenseRouter, prefix="/api")
app.include_router(AnalyticsRouter, prefix="/api")
app.include_router(UserRouter, prefix="/api")
app.include_router(TwoFaRouter, prefix="/api")
app.include_router(LoggingRouter, prefix="/api")
app.include_router(BudgetRouter, prefix="/api")
