from abc import ABC, abstractmethod
from fastapi import Request
from Schema import AuthSchema
from Schema.AuthSchema import UserRegisterResponse, LoginRequest, Token


class IAuthService(ABC):

    @abstractmethod
    def register_user(self, request: AuthSchema.UserCreate, request_session: Request) -> str:
        pass

    @abstractmethod
    def registration_verify_code_and_otp(self, code : int, otp : str, request_session: Request) -> UserRegisterResponse:
        pass

    @abstractmethod
    def login(self, request : LoginRequest, request_session: Request) -> str:
        pass

    @abstractmethod
    def login_verify_code_and_otp(self, code: int, otp: str, request_session: Request) -> Token:
        pass