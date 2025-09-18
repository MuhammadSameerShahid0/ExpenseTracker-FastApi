from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    hashed_password = pwd_context.hash(password)
    return hashed_password


def verify_password_and_hash(plain_password: str, hashed_password: str) -> bool:
    hash_info_and_password_verify = pwd_context.verify(plain_password, hashed_password)
    return hash_info_and_password_verify

