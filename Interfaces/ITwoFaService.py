from abc import ABC, abstractmethod
from typing import Dict
from fastapi import Request
from Schema.TwoFaSchema import User2FAResponse


class ITwoFaService(ABC):

    @abstractmethod
    def enable_2fa(self, user_id: int, request) -> User2FAResponse:
        pass

    @abstractmethod
    def disable_2fa(self, user_id: int) -> Dict[str, str]:
        pass

    @abstractmethod
    def after_enable2fa_verify_otp(self, code: str,request: Request, user_id : int) -> str:
        pass