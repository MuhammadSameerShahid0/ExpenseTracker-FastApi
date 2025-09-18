from abc import ABC, abstractmethod

from Schema.UserSchema import UserDetailResponse

class IUserService(ABC):

    @abstractmethod
    def get_user_details(self, user_id: int) -> UserDetailResponse:
        pass