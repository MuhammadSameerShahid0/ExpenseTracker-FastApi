from fastapi import Depends
from sqlalchemy.orm import Session

from Logging.FileAndDbLogging import get_user_ip, file_and_db_logging
from Models.Table.Logging import Logging as LoggingModel
from OAuthandJWT.JWTToken import verify_jwt

user_ip = get_user_ip()

def get_current_user(payload: dict = Depends(verify_jwt)):
    return payload

def get_id_from_token(current_user: dict = Depends(get_current_user)):
    return current_user["id"]

class FileandDbHandlerLog:
    def __init__(self, db : Session):
        self.db = db

    def logger(self, loglevel: str, message: str, event_source: str, exception : str, user_id: int = None):
        final_user_id = user_id
        if final_user_id is None:
            final_user_id = get_id_from_token()

        logger = file_and_db_logging(event_source)
        loglevel = loglevel.upper()
        if loglevel == "INFO":
            logger.info(f"{message} , user_id : {final_user_id}")
        elif loglevel == "ERROR":
            logger.error(f"{message} , user_id : {final_user_id} , exception: {exception}")
        elif loglevel == "WARNING":
            logger.warning(f"{message} , user_id : {final_user_id}")
        else:
            logger.debug(f"{message} , user_id : {final_user_id}")

        logger_info = LoggingModel(
            loglevel=loglevel,
            message=message,
            event_source=event_source,
            ip_address=user_ip,
            exception=exception,
            user_id=final_user_id
        )

        self.db.add(logger_info)
        self.db.commit()
        self.db.refresh(logger_info)

        return "Logger info added in db successfully"