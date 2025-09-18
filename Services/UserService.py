from fastapi import HTTPException
from sqlalchemy.orm import Session

from Interfaces.IUserService import IUserService
from Schema.UserSchema import UserDetailResponse
from Models.Table.User import User as UserModel

class UserService(IUserService):
    def __init__(self, db: Session):
        self.db = db

    def get_user_details(self, user_id: int) -> UserDetailResponse:
        user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
        if user is not None:
            response = UserDetailResponse(
                id=user.id,
                username=user.username,
                fullname=user.fullname,
                email=user.email,
                created_at=user.created_at,
                status_2fa=user.status_2fa
            )
            return response

        raise HTTPException(status_code=404, detail="User not found")