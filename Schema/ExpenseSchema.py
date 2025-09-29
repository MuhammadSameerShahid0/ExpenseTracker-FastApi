from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ExpenseCreate(BaseModel):
    amount: float
    description: Optional[str] = None
    category_name: str
    date: Optional[datetime] = None
    payment_method : str

class ExpenseResponse(BaseModel):
    id: int
    amount: float
    description: Optional[str] = None
    date: datetime
    category_name: str
    payment_method: str

    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str
    type: str  # "income" or "expense"

class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str

    class Config:
        from_attributes = True

class EditExpenseList(BaseModel):
    transaction_id: int
    amount: float
    category_id: int
    description: str
    payment_method: str
    datetime : datetime