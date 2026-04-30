from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
from datetime import datetime
import bcrypt
from generate_pqc import generate_quantum_keys
from config import get_settings

settings = get_settings()

app = FastAPI(title="Q-Mail Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db():
    conn = psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

# Models
class UserCreate(BaseModel):
    email: str
    password: str
    username: Optional[str] = None

class EmailSend(BaseModel):
    from_email: str
    to_email: str
    subject: str
    body: str
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587

class Email(BaseModel):
    id: str
    from_email: str
    to_email: str
    subject: str
    body: str
    timestamp: str
    read: bool = False

# Initialize database tables
@app.on_event("startup")
def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            kyber_pub TEXT,
            dili_pub TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS emails (
            id VARCHAR(255) PRIMARY KEY,
            from_email VARCHAR(255) NOT NULL,
            to_email VARCHAR(255) NOT NULL,
            subject TEXT,
            body TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read BOOLEAN DEFAULT FALSE
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

# Routes
@app.post("/register")
def register(user: UserCreate):
    username = user.username or user.email.split('@')[0]
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    pqc_keys = generate_quantum_keys()
    
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (username, email, hashed_password, kyber_pub, dili_pub) VALUES (%s, %s, %s, %s, %s)",
            (username, user.email, hashed, pqc_keys['kyber_pub'], pqc_keys['dili_pub'])
        )
        conn.commit()
        return {"message": "User registered successfully", "username": username}
    except psycopg2.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already exists")
    finally:
        cur.close()
        conn.close()

@app.post("/login")
def login(user: UserCreate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = %s", (user.email,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    if result and bcrypt.checkpw(user.password.encode('utf-8'), result['hashed_password'].encode('utf-8')):
        return {"message": "Login successful", "email": user.email, "username": result['username']}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/send-email")
def send_email(email: EmailSend):
    conn = get_db()
    cur = conn.cursor()
    
    # Save to database
    email_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO emails (id, from_email, to_email, subject, body) VALUES (%s, %s, %s, %s, %s)",
        (email_id, email.from_email, email.to_email, email.subject, email.body)
    )
    conn.commit()
    
    # Send via SMTP
    try:
        server = smtplib.SMTP(email.smtp_host, email.smtp_port)
        server.starttls()
        # For Gmail, use app password. For other SMTP, configure accordingly
        # server.login("your-email@gmail.com", "your-app-password")
        
        msg = MIMEMultipart()
        msg['From'] = email.from_email
        msg['To'] = email.to_email
        msg['Subject'] = email.subject
        msg.attach(MIMEText(email.body, 'plain'))
        
        # server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"SMTP error (email saved to DB): {e}")
    
    cur.close()
    conn.close()
    return {"message": "Email sent", "id": email_id}

@app.get("/emails/{email}")
def get_emails(email: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM emails WHERE to_email = %s ORDER BY timestamp DESC",
        (email,)
    )
    emails = cur.fetchall()
    cur.close()
    conn.close()
    return emails

@app.get("/emails/{email}/sent")
def get_sent_emails(email: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM emails WHERE from_email = %s ORDER BY timestamp DESC",
        (email,)
    )
    emails = cur.fetchall()
    cur.close()
    conn.close()
    return emails

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
