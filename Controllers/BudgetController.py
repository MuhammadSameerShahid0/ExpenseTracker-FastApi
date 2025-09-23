from fastapi import FastAPI, APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import Optional

from Factory.AbstractFactory import MySqlServiceFactory
from Interfaces.IBudgetService import IBudgetService
from Models.Database import get_db
from OAuthandJWT.JWTToken import verify_jwt

app = FastAPI()
BudgetRouter = APIRouter(tags=["Budget"])
service_factory = MySqlServiceFactory()

def get_budget_service(db: Session = Depends(get_db)) -> IBudgetService:
    return service_factory.budget_service(db)

Budget_Db_DI = Depends(get_budget_service)

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

@BudgetRouter.post("/add-budget")
def add_budget(
    limit: float = Body(...),
    category_id: int = Body(...),
    services: IBudgetService = Budget_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    return services.add_budget(user_id, limit, category_id)

@BudgetRouter.get("/budgets")
def get_budgets(
    services: IBudgetService = Budget_Db_DI,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    return services.get_budgets(user_id)