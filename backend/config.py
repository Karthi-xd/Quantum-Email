from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    DATABASE_PATH: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    IMAP_HOST: str = "imap.gmail.com"
    IMAP_PORT: int = 993
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    s = Settings()
    if not s.DATABASE_PATH:
        s.DATABASE_PATH = os.path.join(os.path.dirname(__file__), "qmail.db")
    return s