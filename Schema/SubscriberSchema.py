from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SubscriberCreate(BaseModel):
    email: str
    name: Optional[str] = None
    is_active: bool

class SubscriberResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    subscribed_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class WebhookPayload(BaseModel):
    event: str
    data: dict