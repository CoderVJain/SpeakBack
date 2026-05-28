from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_url: str = "mongodb://localhost:27017/strokerehab"
    secret_key: str = "change-me-to-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    groq_api_key: str = ""

    imagekit_public_key: str = ""
    imagekit_private_key: str = ""
    imagekit_url_endpoint: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
