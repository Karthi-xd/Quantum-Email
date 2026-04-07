from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/quantum_mail"
    
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
    return Settings()
