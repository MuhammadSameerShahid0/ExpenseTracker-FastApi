from sqlalchemy.orm import Session
from Models.Table.Logging import Logging as LoggingModel
from Interfaces.ILoggingService import ILoggingService
from Schema.LoggingSchema import GetUserAuthLogsResponse


class LoggingService(ILoggingService):
    def __init__(self, db: Session):
        self.db = db

    def get_user_auth_logs(self, user_id: int, user_email: str):
        result = []
        logs = self.db.query(LoggingModel).filter(
            LoggingModel.user_id == user_id,
            LoggingModel.event_source.startswith("AuthService.Login")).all()

        for log in logs:
            response = GetUserAuthLogsResponse(
                email=user_email,
                message=log.message,
                ip_address=log.ip_address,
                datetime=log.created_at,
            )

            result.append(response)

        return result