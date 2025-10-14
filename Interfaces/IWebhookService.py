from abc import ABC, abstractmethod

from Schema.SubscriberSchema import SubscriberCreate


class IWebhookService(ABC):
    @abstractmethod
    def subscribed_monthly_report(self, request: SubscriberCreate):
        pass

    @abstractmethod
    def unsubscribed_monthly_report(self, email: str) -> str:
        pass