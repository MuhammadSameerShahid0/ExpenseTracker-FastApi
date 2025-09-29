from datetime import datetime

from sqlalchemy import Integer, Column, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import DateTime

from Models.Database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.now)
    description = Column(String(255), nullable=True)
    payment_method = Column(String(255), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="transactions")
    user = relationship("User", back_populates="transactions")