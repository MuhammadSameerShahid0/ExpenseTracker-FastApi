
from sqlalchemy import Integer, Column, String, ForeignKey, Float
from sqlalchemy.orm import relationship

from Models.Database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    limit_amount = Column(Float, nullable=False)
    month = Column(String(7), nullable=False)  # YYYY-MM format
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    category = relationship("Category", back_populates="budgets")
    user = relationship("User", back_populates="budgets")