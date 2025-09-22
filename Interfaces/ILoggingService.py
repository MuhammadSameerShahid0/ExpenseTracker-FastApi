from abc import ABC, abstractmethod

from Schema.LoggingSchema import GetUserAuthLogsResponse


class ILoggingService(ABC):

    @abstractmethod
    def get_user_auth_logs(self, user_id: int, user_email: str) -> GetUserAuthLogsResponse:
        pass