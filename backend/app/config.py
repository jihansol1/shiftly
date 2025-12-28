"""
purpose of config fle: load .env variables and make them accessuble throughout the app as a single settings object.
Instead of reading environment variables everywhere, you import settings once. 
"""

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# load .env file into environment
load_dotenv()

class Settings(BaseSettings):
    """
    Application settings loadaded from environment variables
    Pydantic automatically reads from environment and validates types.
    """

    # Databse
    database_url: str

    # JWT Authentication
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Claude API
    anthropic_api_key: str

    class Config:
        env_file = ".env"
        case_sensitive = False
    
# create a single instance to import everywhere
settings = Settings()
