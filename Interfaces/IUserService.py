from abc import ABC, abstractmethod

from Schema.UserSchema import UserDetailResponse, ContactSchema


class IUserService(ABC):

    @abstractmethod
    def get_user_details(self, user_id: int) -> UserDetailResponse:
        pass

    @abstractmethod
    def contact_message(self, request : ContactSchema) -> str:
        pass