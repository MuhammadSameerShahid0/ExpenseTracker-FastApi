from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from Models.Database import Base


class Logging(Base):
    __tablename__ = "logging"

    id = Column(Integer, primary_key=True, index=True)
    loglevel = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    event_source  = Column(String(255), nullable=False)
    ip_address = Column(String(255), nullable=True)
    exception = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationship
    user = relationship("User", back_populates="logs")

