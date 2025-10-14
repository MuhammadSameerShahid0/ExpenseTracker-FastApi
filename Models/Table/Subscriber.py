from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from Models.Database import Base


class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    subscribed_at = Column(DateTime, default=datetime.now)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<Subscriber(email='{self.email}', name='{self.name}')>"