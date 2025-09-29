from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status
from Models.Table.User import User as UserModel
from Interfaces.ITwoFaService import ITwoFaService
from Schema.TwoFaSchema import User2FAResponse
from TwoFAgoogle.SecretandQRCode import generate_2fa_secret, generate_qrcode
from Logging.Helper.FileandDbLogHandler import FileandDbHandlerLog


class TwoFaService(ITwoFaService):
    def __init__(self, db: Session):
        self.db = db
        self.file_and_db_handler_log = FileandDbHandlerLog(db)

    def enable_2fa(self, user_id: int):
        try:
            user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
            if not user:
                logger_message = f"Attempt to enable 2FA for non-existent user {user_id}"
                self.file_and_db_handler_log.logger(
                    loglevel="WARNING",
                    message=logger_message,
                    event_source="TwoFaService.Enable2FA",
                    exception="User not found",
                    user_id=user_id
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Entered details not found anywhere"
                )

            if user.status_2fa is True:
                logger_message = f"Attempt to enable 2FA for user {user.email} who already has 2FA enabled"
                self.file_and_db_handler_log.logger(
                    loglevel="WARNING",
                    message=logger_message,
                    event_source="TwoFaService.Enable2FA",
                    exception="2FA already enabled",
                    user_id=user_id
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"2FA already enabled for {user.email}"
                )

            secret, otp_uri = generate_2fa_secret(user.email)
            qr_code = generate_qrcode(otp_uri)

            user.secret_2fa = secret
            user.status_2fa = True
            self.db.commit()
            self.db.refresh(user)

            logger_message = f"2FA enabled successfully for user {user.email}"
            self.file_and_db_handler_log.logger(
                loglevel="INFO",
                message=logger_message,
                event_source="TwoFaService.Enable2FA",
                exception="NULL",
                user_id=user_id
            )

            response = User2FAResponse(
                msg="ThankYou for enabled 2FA, Scan the qr_code from any authenticator",
                qr_code_2fa=qr_code,
                secret_key_2fa=secret
            )

            return response
        except Exception as ex:
            logger_message = f"Error enabling 2FA for user {user_id}"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="TwoFaService.Enable2FA",
                exception=str(ex),
                user_id=user_id
            )
            code = getattr(ex, 'status_code', status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )

    def disable_2fa(self, user_id: int):
        try:
            user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
            if user:
                if user.secret_2fa:
                    user.secret_2fa = "NULL"
                    user.status_2fa = False

                    self.db.commit()
                    self.db.refresh(user)

                    logger_message = f"2FA disabled successfully for user {user.email}"
                    self.file_and_db_handler_log.logger(
                        loglevel="INFO",
                        message=logger_message,
                        event_source="TwoFaService.Disable2FA",
                        exception="NULL",
                        user_id=user_id
                    )

                    return {"msg": "2FA disabled successfully"}
                else:
                    logger_message = f"Attempt to disable 2FA for user {user.email}, but 2FA was already disabled"
                    self.file_and_db_handler_log.logger(
                        loglevel="INFO",
                        message=logger_message,
                        event_source="TwoFaService.Disable2FA",
                        exception="2FA already disabled",
                        user_id=user_id
                    )
                    return {"msg": "2FA already disabled"}

            logger_message = f"Attempt to disable 2FA for non-existent user {user_id}"
            self.file_and_db_handler_log.logger(
                loglevel="WARNING",
                message=logger_message,
                event_source="TwoFaService.Disable2FA",
                exception="User not found",
                user_id=user_id
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entered details not found anywhere"
            )
        except Exception as ex:
            logger_message = f"Error disabling 2FA for user {user_id}"
            self.file_and_db_handler_log.logger(
                loglevel="ERROR",
                message=logger_message,
                event_source="TwoFaService.Disable2FA",
                exception=str(ex),
                user_id=user_id
            )
            code = getattr(ex, 'status_code', status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )