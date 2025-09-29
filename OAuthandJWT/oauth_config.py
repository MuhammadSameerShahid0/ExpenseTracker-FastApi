import os
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config


def setup_google_oauth():
    config = Config(".env")
    oauth = OAuth(config)

    oauth.register(
        name="google",
        client_id=os.getenv("CLIENT_ID"),
        client_secret=os.getenv("CLIENT_SECRET"),
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={
            "scope": "openid email profile",
            "jwks_ri": "https://www.googleapis.com/auth2/v3/certs",
        },
        authorize_url="https://accounts.google.com/o/oauth2/auth",
        access_token_url="https://oauth2.googleapis.com/token",
        api_base_url="https://www.googleapis.com/oauth2/v3/"
    )

    return oauth

google_oauth = setup_google_oauth()