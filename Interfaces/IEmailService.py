from abc import ABC, abstractmethod


class IEmailService(ABC):

    @abstractmethod
    def send_email(self, user_email: str, subject: str, body: str):
        pass

    def email_code(self) -> int:
        pass

    def register_template(self, verification_code: int, name: str) -> str:
        pass