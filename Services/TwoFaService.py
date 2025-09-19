from fastapi import HTTPException
from sqlalchemy.orm import Session
from starlette import status
from Models.Table.User import User as UserModel
from Interfaces.ITwoFaService import ITwoFaService
from Schema.TwoFaSchema import User2FAResponse
from TwoFAgoogle.SecretandQRCode import generate_2fa_secret, generate_qrcode


class TwoFaService(ITwoFaService):
    def __init__(self, db: Session):
        self.db = db

    def enable_2fa(self, user_id: int):
        try:
            user = self.db.query(UserModel).filter(UserModel.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Entered details not found anywhere"
                )

            if user.status_2fa is True:
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

            response = User2FAResponse(
                msg="ThankYou for enabled 2FA, Scan the qr_code from any authenticator",
                qr_code_2fa=qr_code
            )

            return response
        except Exception as ex:
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

                    return {"msg": "2FA disabled successfully"}

                return {"msg": "2FA already disabled"}

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entered details not found anywhere"
            )
        except Exception as ex:
            code = getattr(ex, 'status_code', status.HTTP_500_INTERNAL_SERVER_ERROR)
            if isinstance(ex, HTTPException):
                raise ex

            raise HTTPException(
                status_code=code,
                detail=str(ex)
            )