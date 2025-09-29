import os

from dotenv import load_dotenv
from fastapi import FastAPI
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