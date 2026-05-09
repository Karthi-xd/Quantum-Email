from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import smtplib
import imaplib
import email as email_lib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import uuid
from datetime import datetime
from contextlib import asynccontextmanager
import bcrypt
from generate_pqc import (
    generate_quantum_keys,
    encrypt_email_body,
    decrypt_email_body,
    encrypt_private_key,
    decrypt_private_key,
)
from config import get_settings

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Q-Mail Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

class UserCreate(BaseModel):
    email: str
    password: str
    username: Optional[str] = None

class EmailSend(BaseModel):
    from_email: str
    to_email: str
    subject: str
    body: str
    account_password: str = ""
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_password: str = ""

class EmailFetchRequest(BaseModel):
    email: str
    password: str

class ImapFetch(BaseModel):
    email: str
    password: str
    imap_host: str = "imap.gmail.com"
    imap_port: int = 993

def column_exists(cur, table, col):
    cur.execute(f"PRAGMA table_info({table})")
    return any(row[1] == col for row in cur.fetchall())

def migrate_db():
    conn = get_db()
    cur = conn.cursor()
    for col in ["kyber_private_key_enc", "dilithium_private_key_enc"]:
        if not column_exists(cur, "users", col):
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT")
    for col in ["encrypted_body", "encrypted_key", "signature"]:
        if not column_exists(cur, "emails", col):
            cur.execute(f"ALTER TABLE emails ADD COLUMN {col} TEXT")
    if not column_exists(cur, "emails", "verified"):
        cur.execute("ALTER TABLE emails ADD COLUMN verified BOOLEAN DEFAULT FALSE")
    conn.commit()
    cur.close()
    conn.close()

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            kyber_public_key TEXT,
            dilithium_public_key TEXT,
            kyber_private_key_enc TEXT,
            dilithium_private_key_enc TEXT,
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
            encrypted_body TEXT,
            encrypted_key TEXT,
            signature TEXT,
            verified BOOLEAN DEFAULT FALSE,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read BOOLEAN DEFAULT FALSE
        )
    """)
    conn.commit()
    cur.close()
    conn.close()
    migrate_db()

@app.post("/register")
def register(user: UserCreate):
    username = user.username or user.email.split('@')[0]
    email = user.email.strip().lower()
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    pqc_keys = generate_quantum_keys()
    kyber_priv_enc = encrypt_private_key(
        pqc_keys['kyber_priv'].encode('utf-8'), hashed
    )
    dili_priv_enc = encrypt_private_key(
        pqc_keys['dili_priv'].encode('utf-8'), hashed
    )

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO users 
               (username, email, password_hash, kyber_public_key, dilithium_public_key, kyber_private_key_enc, dilithium_private_key_enc) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (username, email, hashed, pqc_keys['kyber_pub'], pqc_keys['dili_pub'],
             kyber_priv_enc, dili_priv_enc)
        )
        conn.commit()
        return {
            "message": "User registered successfully",
            "username": username,
            "kyber_pub": pqc_keys['kyber_pub'],
            "dili_pub": pqc_keys['dili_pub'],
        }
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already exists")
    finally:
        cur.close()
        conn.close()

@app.post("/login")
def login(user: UserCreate):
    email = user.email.strip().lower()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    password_match = bcrypt.checkpw(user.password.encode('utf-8'), row['password_hash'].encode('utf-8'))
    if not password_match:
        cur.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    result = dict(row)

    resp = {
        "message": "Login successful",
        "email": email,
        "username": result['username'],
        "kyber_pub": result.get('kyber_public_key') or "",
        "dili_pub": result.get('dilithium_public_key') or "",
    }

    if not result.get('kyber_private_key_enc'):
        pqc_keys = generate_quantum_keys()
        hashed = result['password_hash']
        kyber_priv_enc = encrypt_private_key(
            pqc_keys['kyber_priv'].encode('utf-8'), hashed
        )
        dili_priv_enc = encrypt_private_key(
            pqc_keys['dili_priv'].encode('utf-8'), hashed
        )
        cur.execute(
            """UPDATE users SET 
               kyber_public_key=?, dilithium_public_key=?,
               kyber_private_key_enc=?, dilithium_private_key_enc=?
               WHERE email=?""",
            (pqc_keys['kyber_pub'], pqc_keys['dili_pub'],
             kyber_priv_enc, dili_priv_enc, email)
        )
        conn.commit()
        resp['kyber_pub'] = pqc_keys['kyber_pub']
        resp['dili_pub'] = pqc_keys['dili_pub']

    cur.close()
    conn.close()
    return resp

@app.post("/send-email")
def send_email(email: EmailSend):
    conn = get_db()
    cur = conn.cursor()

    email_id = str(uuid.uuid4())

    if email.account_password:
        cur.execute("SELECT * FROM users WHERE email = ?", (email.from_email,))
        sender_row = cur.fetchone()
        cur.execute("SELECT * FROM users WHERE email = ?", (email.to_email,))
        recipient_row = cur.fetchone()
        sender = dict(sender_row) if sender_row else None
        recipient = dict(recipient_row) if recipient_row else None

        if sender and recipient and recipient.get('kyber_public_key'):
            try:
                sender_hash = sender['password_hash']
                kyber_priv_bytes = decrypt_private_key(
                    sender['kyber_private_key_enc'], sender_hash
                )
                dili_priv_bytes = decrypt_private_key(
                    sender['dilithium_private_key_enc'], sender_hash
                )

                result = encrypt_email_body(
                    email.body,
                    recipient['kyber_public_key'],
                    dili_priv_bytes.decode('utf-8'),
                )

                cur.execute(
                    """INSERT INTO emails 
                       (id, from_email, to_email, subject, encrypted_body, encrypted_key, signature)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (email_id, email.from_email, email.to_email, email.subject,
                     result['encrypted_body'], result['encrypted_key'], result['signature'])
                )
            except Exception as e:
                print(f"PQC encryption error (saving plaintext fallback): {e}")
                cur.execute(
                    "INSERT INTO emails (id, from_email, to_email, subject, body) VALUES (?, ?, ?, ?, ?)",
                    (email_id, email.from_email, email.to_email, email.subject, email.body)
                )
        else:
            cur.execute(
                "INSERT INTO emails (id, from_email, to_email, subject, body) VALUES (?, ?, ?, ?, ?)",
                (email_id, email.from_email, email.to_email, email.subject, email.body)
            )
    else:
        cur.execute(
            "INSERT INTO emails (id, from_email, to_email, subject, body) VALUES (?, ?, ?, ?, ?)",
            (email_id, email.from_email, email.to_email, email.subject, email.body)
        )

    conn.commit()

    if email.smtp_password:
        try:
            server = smtplib.SMTP(email.smtp_host, email.smtp_port)
            server.starttls()
            server.login(email.from_email, email.smtp_password)

            msg = MIMEMultipart()
            msg['From'] = email.from_email
            msg['To'] = email.to_email
            msg['Subject'] = email.subject
            msg.attach(MIMEText(email.body, 'plain'))

            server.send_message(msg)
            server.quit()
        except Exception as e:
            print(f"SMTP error (email saved to DB): {e}")

    cur.close()
    conn.close()
    return {"message": "Email sent", "id": email_id}

@app.post("/emails")
def get_emails(req: EmailFetchRequest):
    email = req.email.strip().lower()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM emails WHERE to_email = ? ORDER BY timestamp DESC",
        (email,)
    )
    rows = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user_row = cur.fetchone()
    user = dict(user_row) if user_row else None

    result = []
    for row in rows:
        email_data = {
            "id": row['id'],
            "from": row['from_email'],
            "to": row['to_email'],
            "subject": row['subject'],
            "body": row['body'] or "",
            "preview": "",
            "time": row['timestamp'].isoformat() if row['timestamp'] else "",
            "read": row['read'],
            "encrypted": False,
            "verified": False,
        }

        if row.get('encrypted_body') and row.get('encrypted_key') and row.get('signature'):
            email_data["encrypted"] = True
            if user and user.get('kyber_private_key_enc') and req.password:
                try:
                    sender_row = None
                    cur2 = conn.cursor()
                    cur2.execute("SELECT * FROM users WHERE email = ?", (row['from_email'],))
                    sender_row = cur2.fetchone()
                    cur2.close()

                    sender_dili_pub = sender_row['dilithium_public_key'] if sender_row else ""

                    password_hash = user['password_hash']
                    kyber_priv_bytes = decrypt_private_key(
                        user['kyber_private_key_enc'], password_hash
                    )

                    decrypted = decrypt_email_body(
                        row['encrypted_body'],
                        row['encrypted_key'],
                        row['signature'],
                        kyber_priv_bytes.decode('utf-8'),
                        sender_dili_pub,
                    )
                    email_data["body"] = decrypted["body"]
                    email_data["verified"] = decrypted["verified"]
                    email_data["preview"] = decrypted["body"][:100]
                except Exception as e:
                    email_data["body"] = "[Unable to decrypt - invalid key or corrupted data]"
                    email_data["preview"] = "[Encrypted]"
                    email_data["verified"] = False
            else:
                email_data["body"] = "[Encrypted - provide password to decrypt]"
                email_data["preview"] = "[Encrypted]"
        else:
            email_data["preview"] = (row['body'] or "")[:100]

        result.append(email_data)

    cur.close()
    conn.close()
    return result

@app.post("/emails/sent")
def get_sent_emails(req: EmailFetchRequest):
    email = req.email.strip().lower()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM emails WHERE from_email = ? ORDER BY timestamp DESC",
        (email,)
    )
    rows = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user_row = cur.fetchone()
    user = dict(user_row) if user_row else None

    result = []
    for row in rows:
        email_data = {
            "id": row['id'],
            "from": row['from_email'],
            "to": row['to_email'],
            "subject": row['subject'],
            "body": "",
            "preview": "",
            "time": row['timestamp'].isoformat() if row['timestamp'] else "",
            "read": row['read'],
            "encrypted": False,
            "verified": False,
        }

        if row.get('encrypted_body') and row.get('encrypted_key') and row.get('signature'):
            email_data["encrypted"] = True
            if user and user.get('kyber_private_key_enc') and req.password:
                try:
                    sender_row = None
                    cur2 = conn.cursor()
                    cur2.execute("SELECT * FROM users WHERE email = ?", (row['to_email'],))
                    sender_row = cur2.fetchone()
                    cur2.close()

                    sender_dili_pub = sender_row['dilithium_public_key'] if sender_row else ""

                    password_hash = user['password_hash']
                    kyber_priv_bytes = decrypt_private_key(
                        user['kyber_private_key_enc'], password_hash
                    )

                    decrypted = decrypt_email_body(
                        row['encrypted_body'],
                        row['encrypted_key'],
                        row['signature'],
                        kyber_priv_bytes.decode('utf-8'),
                        sender_dili_pub,
                    )
                    email_data["body"] = decrypted["body"]
                    email_data["verified"] = decrypted["verified"]
                    email_data["preview"] = decrypted["body"][:100]
                except Exception:
                    email_data["body"] = "[Unable to decrypt]"
                    email_data["preview"] = "[Encrypted]"
                    email_data["verified"] = False
            else:
                email_data["body"] = "[Encrypted]"
                email_data["preview"] = "[Encrypted]"
        else:
            email_data["body"] = row['body'] or ""
            email_data["preview"] = (row['body'] or "")[:100]

        result.append(email_data)

    cur.close()
    conn.close()
    return result

@app.get("/public-keys/{email}")
def get_public_keys(email: str):
    email = email.strip().lower()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT kyber_public_key, dilithium_public_key FROM users WHERE email = ?",
        (email,)
    )
    result = cur.fetchone()
    cur.close()
    conn.close()
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "kyber_pub": result['kyber_public_key'],
        "dili_pub": result['dilithium_public_key'],
    }

@app.post("/fetch-imap")
def fetch_imap(req: ImapFetch):
    try:
        mail = imaplib.IMAP4_SSL(req.imap_host, req.imap_port)
        mail.login(req.email, req.password)
        mail.select("INBOX")

        _, data = mail.search(None, "ALL")
        ids = data[0].split()
        ids = ids[-20:]

        emails = []
        for mid in ids:
            _, msg_data = mail.fetch(mid, "(RFC822)")
            raw = msg_data[0][1]
            msg = email_lib.message_from_bytes(raw)

            subject = msg["Subject"] or "(No Subject)"
            from_addr = msg["From"] or "unknown"
            date = msg["Date"] or ""

            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

            emails.append({
                "id": str(mid),
                "from": from_addr,
                "to": req.email,
                "subject": subject,
                "body": body,
                "preview": body[:100],
                "time": date,
                "read": False,
                "encrypted": False,
                "verified": False,
            })

        mail.logout()
        return emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IMAP fetch failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
