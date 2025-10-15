import logging
import os
from logging.handlers import TimedRotatingFileHandler
import httpx

def file_and_db_logging(filename: str):
    log_directory = "Logs"
    trim_filename = filename.split(".", 1)[0]
    log_file_path = os.path.join(log_directory, f"{trim_filename}.txt")

    ENV = os.getenv("APP_ENV", "development").lower()
    logger = logging.getLogger(filename)

    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(formatter)
        logger.addHandler(stream_handler)

        if ENV == "development":
            os.makedirs(log_directory, exist_ok=True)
            file_handler = TimedRotatingFileHandler(
                log_file_path,
                when="midnight",
                backupCount=7,
                delay=True,
                encoding="utf-8"
            )
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)

    return logger


def get_user_ip():
    ip_url = "https://api.ipify.org"
    with httpx.Client() as client:
        response = client.get(ip_url)
        return response.text
