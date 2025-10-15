from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from Models.Database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True,  nullable=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    fullname = Column(String(50), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    status_2fa = Column(Boolean, default=False)
    secret_2fa = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    in_active_date = Column(DateTime, default=datetime.now)

    # Relationships
    categories = relationship("Category", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    logs = relationship("Logging", back_populates="user")
