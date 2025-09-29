from abc import ABC, abstractmethod
from typing import Dict

from Schema.TwoFaSchema import User2FAResponse


class ITwoFaService(ABC):

    @abstractmethod
    def enable_2fa(self, user_id: int) -> User2FAResponse:
        pass

    @abstractmethod
    def disable_2fa(self, user_id: int) -> Dict[str, str]:
        pass