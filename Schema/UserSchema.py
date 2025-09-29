import datetime

from pydantic import BaseModel
from typing import Optional

class UserDetailResponse(BaseModel):
    id: int
    username: str
    fullname: str
    email: str
    created_at: datetime.datetime
    status_2fa: bool
