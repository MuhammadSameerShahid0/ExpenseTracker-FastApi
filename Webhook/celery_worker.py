from celery import Celery
import os

redis_url = os.getenv("UPSTASH_REDIS_URL")

celery_app = Celery(
    "expense_report_tasks",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    timezone="UTC",
    broker_connection_retry_on_startup=True,
)
