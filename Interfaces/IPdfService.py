from abc import ABC
from io import BytesIO


class IPdfService(ABC):
    def generate_expenses_pdf(self, expenses: list) -> BytesIO:
        pass

    def download_expenses_pdf(
            self,
            user_id: int,
            username: str,
            skip: int = 0,
            limit: int = 100):
        pass