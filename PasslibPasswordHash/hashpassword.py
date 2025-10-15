from fastapi import HTTPException
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    try:
        hashed_password = pwd_context.hash(password)
        return hashed_password
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def verify_password_and_hash(plain_password: str, hashed_password: str) -> bool:
    try:
        hash_info_and_password_verify = pwd_context.verify(plain_password, hashed_password)
        return hash_info_and_password_verify
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

