import json
import os
import redis
from fastapi.encoders import jsonable_encoder

ENV = os.getenv("APP_ENV", "development")

if ENV == "production":
    REDIS_HOST = os.getenv("REDIS_HOST")
    REDIS_PORT = int(os.getenv("REDIS_PORT"))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
    REDIS_DB = int(os.getenv("REDIS_DB"))

    try:
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            password=REDIS_PASSWORD,
            db=REDIS_DB,
            ssl=True,
            decode_responses=True,
        )
        redis_client.ping()
    except Exception as e:
        redis_client = None

else:
    REDIS_HOST = os.getenv("REDIS_LOCAL_HOST")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB = int(os.getenv("REDIS_DB", 0))

    try:
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=True,
        )
        redis_client.ping()
    except Exception as e:
        redis_client = None


def set_cache(key: str, value, ex: int = 86400):
    if not redis_client:
        return
    try:
        payload = json.dumps(jsonable_encoder(value))
        redis_client.set(key, payload, ex=ex)
    except Exception as e:
        print("Redis set_cache error:", e)


def get_cache(key: str):
    if not redis_client:
        return None
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
        return None
    except Exception as e:
        print("Redis get_cache error:", e)
        return None


def delete_cache(key: str):
    if not redis_client:
        return
    try:
        redis_client.delete(key)
    except Exception as e:
        print("Redis delete_cache error:", e)


def clear_cache_by_pattern(pattern: str):
    """Use a match pattern. Example: 'analytics:*:5*'"""
    if not redis_client:
        return
    try:
        for k in redis_client.scan_iter(match=pattern):
            redis_client.delete(k)
    except Exception as e:
        print("Redis clear_cache_by_pattern error:", e)
