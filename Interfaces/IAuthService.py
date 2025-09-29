from abc import ABC, abstractmethod
from fastapi import Request
from Schema import AuthSchema
from Schema.AuthSchema import UserRegisterResponse, LoginRequest, Token, ChangePassword
from typing import Union


class IAuthService(ABC):
    @abstractmethod
    async def google_register(self, request: Request):
        pass

    @abstractmethod
    async def google_callback(self, request: Request) -> Token:
        pass
    @abstractmethod
    def register_user(self, request: AuthSchema.UserCreate, request_session: Request) ->  Union[str, UserRegisterResponse]:
        pass

    @abstractmethod
    def registration_verify_code_and_otp(self, code : int, otp : str, request_session: Request) -> UserRegisterResponse:
        pass

    @abstractmethod
    def login(self, request : LoginRequest, request_session: Request) -> Union[str, Token]:
        pass

    @abstractmethod
    def login_verify_code_and_otp(self, code: int, otp: str, request_session: Request) -> Token:
        pass

    @abstractmethod
    def delete_account(self, user_id:int) -> str:
        pass

    @abstractmethod
    def re_active_account(self, email: str, request_session: Request) -> str:
        pass

    @abstractmethod
    def re_active_account_verification_email_code(self, code: int, request_session: Request) -> Token:
        pass

    @abstractmethod
    def change_password(self, request: ChangePassword) -> str:
        pass