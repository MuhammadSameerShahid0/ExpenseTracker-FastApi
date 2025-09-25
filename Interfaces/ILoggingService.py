from abc import ABC, abstractmethod
from typing import List

from Schema.LoggingSchema import GetUserAuthLogsResponse, SelectedLogging


class ILoggingService(ABC):

    @abstractmethod
    def get_user_auth_logs(self, user_id: int, user_email: str) -> GetUserAuthLogsResponse:
        pass

    @abstractmethod
    def return_selected_logging(self,user_id: int, user_email: str) -> List[SelectedLogging]:
        pass