import os

from dotenv import load_dotenv
from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from Controllers.AuthController import AuthRouter
from Controllers.ExpenseController import ExpenseRouter
from Controllers.AnalyticsController import AnalyticsRouter

load_dotenv()

app = FastAPI()
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY"),  # must be secure in production
)

app.include_router(AuthRouter, prefix="/api")
app.include_router(ExpenseRouter, prefix="/api")
app.include_router(AnalyticsRouter, prefix="/api")