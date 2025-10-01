from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status

from Interfaces.IUserService import IUserService
from Schema.UserSchema import UserDetailResponse, ContactSchema
from Models.Table.User import User as UserModel
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog
from Services.EmailService import EmailService


class UserService(IUserService):
    def __init__(self, db: Session,email_service: EmailService):
        self.db = db
        self.email_service = email_service
        self.file_and_db_handler_log = FileandDbHandlerLog(db)

    def get_user_details(self, user_id: int) -> UserDetailResponse:
        try:
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
                
                logger_message = f"User details retrieved for user {user.email}"
                self.file_and_db_handler_log.file_logger(
                    loglevel="INFO",
                    message=logger_message,
                    event_source="UserService.GetUserDetails",
                    exception="NULL",
                    user_id=user_id
                )
                
                return response
            else:
                logger_message = f"Attempt to retrieve details for non-existent user {user_id}"
                self.file_and_db_handler_log.file_logger(
                    loglevel="WARNING",
                    message=logger_message,
                    event_source="UserService.GetUserDetails",
                    exception="User not found",
                    user_id=user_id
                )
                raise HTTPException(status_code=404, detail="User not found")
        except Exception as ex:
            logger_message = f"Error retrieving user details for user {user_id}"
            self.file_and_db_handler_log.file_logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="UserService.GetUserDetails",
                exception=str(ex),
                user_id=user_id
            )
            raise ex

    def contact_message(self, request: ContactSchema):
        subject = request.subject
        body = request.message
        if subject.__contains__("@"):
            self.email_service.send_email("jakehken728@gmail.com", subject, body)
            return f"Thank you '{request.name}'! Your message has been sent successfully."

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kindly add your email/mail in subject, ThankYou!")