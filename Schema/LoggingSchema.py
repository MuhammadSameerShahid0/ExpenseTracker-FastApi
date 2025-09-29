from pydantic import BaseModel
from datetime import datetime

class GetUserAuthLogsResponse(BaseModel):
    email: str
    message: str
    ip_address: str
    datetime: datetime

class SelectedLogging(BaseModel):
    source : str
    email: str
    message: str
    ip_address: str
    datetime: datetime