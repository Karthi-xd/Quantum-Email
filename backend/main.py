from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
import base64
import secrets
import time
import smtplib
import imaplib
import email as email_lib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
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
    get_fingerprint,
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

# --- Sessions ---
# In-memory only: tokens are lost on server restart, which is fine since
# they're short-lived and re-issued on login. Not shared across processes -
# if you run multiple backend workers, move this to Redis/DB.
SESSION_TTL_SECONDS = 30 * 60  # 30 minutes, sliding expiry
SESSIONS: dict[str, dict] = {}


def _create_session(email: str, password: str) -> str:
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = {
        "email": email,
        "password": password,
        "expires": time.time() + SESSION_TTL_SECONDS,
    }
    return token


def _require_session(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1].strip()
    session = SESSIONS.get(token)
    if not session or session["expires"] < time.time():
        SESSIONS.pop(token, None)
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    session["expires"] = time.time() + SESSION_TTL_SECONDS  # sliding expiry
    return session


# --- Rate limiting (brute-force protection) ---
# In-memory only, same caveat as SESSIONS: fine for a single process, move to
# Redis/DB if you scale to multiple backend workers.
_rate_buckets: dict[str, list[float]] = {}


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _too_many_attempts(key: str, max_attempts: int, window_seconds: int) -> bool:
    now = time.time()
    bucket = _rate_buckets.setdefault(key, [])
    cutoff = now - window_seconds
    while bucket and bucket[0] < cutoff:
        bucket.pop(0)
    return len(bucket) >= max_attempts


def _record_attempt(key: str) -> None:
    _rate_buckets.setdefault(key, []).append(time.time())


def _reset_attempts(key: str) -> None:
    _rate_buckets.pop(key, None)


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
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_password: str = ""


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
    new_user_cols = [
        "x25519_public_key", "x25519_private_key_enc",
        "ed25519_public_key", "ed25519_private_key_enc",
        "fingerprint", "key_salt",
    ]
    for col in new_user_cols:
        if not column_exists(cur, "users", col):
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT")
    new_email_cols = ["ed25519_sig"]
    for col in new_email_cols:
        if not column_exists(cur, "emails", col):
            cur.execute(f"ALTER TABLE emails ADD COLUMN {col} TEXT")
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
            ed25519_sig TEXT,
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
def register(user: UserCreate, request: Request):
    ip_key = f"register-ip:{_client_ip(request)}"
    if _too_many_attempts(ip_key, max_attempts=5, window_seconds=3600):
        raise HTTPException(
            status_code=429,
            detail="Too many registration attempts from this network. Please try again later.",
        )
    _record_attempt(ip_key)

    username = user.username or user.email.split('@')[0]
    email = user.email.strip().lower()
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    key_salt_bytes = os.urandom(16)
    key_salt = base64.b64encode(key_salt_bytes).decode('utf-8')

    pqc_keys = generate_quantum_keys()
    key_pairs = [
        ("kyber_priv", pqc_keys['kyber_priv']),
        ("dili_priv", pqc_keys['dili_priv']),
        ("x25519_priv", pqc_keys['x25519_priv']),
        ("ed25519_priv", pqc_keys['ed25519_priv']),
    ]
    encrypted = {}
    for name, val in key_pairs:
        encrypted[name] = encrypt_private_key(val.encode('utf-8'), user.password, key_salt_bytes)

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO users
               (username, email, password_hash,
                kyber_public_key, dilithium_public_key, kyber_private_key_enc, dilithium_private_key_enc,
                x25519_public_key, x25519_private_key_enc,
                ed25519_public_key, ed25519_private_key_enc,
                fingerprint, key_salt)
               VALUES (?, ?, ?,
                       ?, ?, ?, ?,
                       ?, ?,
                       ?, ?,
                       ?, ?)""",
            (username, email, hashed,
             pqc_keys['kyber_pub'], pqc_keys['dili_pub'], encrypted['kyber_priv'], encrypted['dili_priv'],
             pqc_keys['x25519_pub'], encrypted['x25519_priv'],
             pqc_keys['ed25519_pub'], encrypted['ed25519_priv'],
             pqc_keys['fingerprint'], key_salt)
        )
        conn.commit()
        token = _create_session(email, user.password)
        return {
            "message": "User registered successfully",
            "token": token,
            "username": username,
            "kyber_pub": pqc_keys['kyber_pub'],
            "dili_pub": pqc_keys['dili_pub'],
            "x25519_pub": pqc_keys['x25519_pub'],
            "ed25519_pub": pqc_keys['ed25519_pub'],
            "fingerprint": pqc_keys['fingerprint'],
        }
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already exists")
    finally:
        cur.close()
        conn.close()


@app.post("/login")
def login(user: UserCreate, request: Request):
    email = user.email.strip().lower()
    email_key = f"login-email:{email}"
    ip_key = f"login-ip:{_client_ip(request)}"

    # Per-email lockout stops targeted guessing of one account; per-IP
    # lockout stops one source spraying many emails. Both must be checked
    # before touching the DB so a locked-out caller can't even probe
    # whether an email exists.
    if _too_many_attempts(email_key, max_attempts=5, window_seconds=900) or \
       _too_many_attempts(ip_key, max_attempts=20, window_seconds=900):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again in a few minutes.",
        )

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        _record_attempt(email_key)
        _record_attempt(ip_key)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    password_match = bcrypt.checkpw(user.password.encode('utf-8'), row['password_hash'].encode('utf-8'))
    if not password_match:
        cur.close()
        conn.close()
        _record_attempt(email_key)
        _record_attempt(ip_key)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    _reset_attempts(email_key)
    _reset_attempts(ip_key)

    result = dict(row)
    token = _create_session(email, user.password)

    resp = {
        "message": "Login successful",
        "token": token,
        "email": email,
        "username": result['username'],
        "kyber_pub": result.get('kyber_public_key') or "",
        "dili_pub": result.get('dilithium_public_key') or "",
        "x25519_pub": result.get('x25519_public_key') or "",
        "ed25519_pub": result.get('ed25519_public_key') or "",
        "fingerprint": result.get('fingerprint') or "",
    }

    needs_regenerate = not result.get('x25519_public_key') or not result.get('fingerprint')
    if needs_regenerate:
        pqc_keys = generate_quantum_keys()
        key_salt_bytes = base64.b64decode(result['key_salt']) if result.get('key_salt') else os.urandom(16)
        key_salt = base64.b64encode(key_salt_bytes).decode('utf-8')
        key_pairs = [
            ("kyber_priv", pqc_keys['kyber_priv']),
            ("dili_priv", pqc_keys['dili_priv']),
            ("x25519_priv", pqc_keys['x25519_priv']),
            ("ed25519_priv", pqc_keys['ed25519_priv']),
        ]
        encrypted = {}
        for name, val in key_pairs:
            encrypted[name] = encrypt_private_key(val.encode('utf-8'), user.password, key_salt_bytes)

        cur.execute(
            """UPDATE users SET
               kyber_public_key=?, dilithium_public_key=?,
               kyber_private_key_enc=?, dilithium_private_key_enc=?,
               x25519_public_key=?, x25519_private_key_enc=?,
               ed25519_public_key=?, ed25519_private_key_enc=?,
               fingerprint=?, key_salt=?
               WHERE email=?""",
            (pqc_keys['kyber_pub'], pqc_keys['dili_pub'],
             encrypted['kyber_priv'], encrypted['dili_priv'],
             pqc_keys['x25519_pub'], encrypted['x25519_priv'],
             pqc_keys['ed25519_pub'], encrypted['ed25519_priv'],
             pqc_keys['fingerprint'], key_salt, email)
        )
        conn.commit()
        resp['kyber_pub'] = pqc_keys['kyber_pub']
        resp['dili_pub'] = pqc_keys['dili_pub']
        resp['x25519_pub'] = pqc_keys['x25519_pub']
        resp['ed25519_pub'] = pqc_keys['ed25519_pub']
        resp['fingerprint'] = pqc_keys['fingerprint']

    cur.close()
    conn.close()
    return resp


@app.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        SESSIONS.pop(authorization.split(" ", 1)[1].strip(), None)
    return {"message": "Logged out"}


@app.post("/send-email")
def send_email(email: EmailSend, session: dict = Depends(_require_session)):
    if email.from_email.strip().lower() != session["email"]:
        raise HTTPException(status_code=403, detail="Cannot send as another account")
    account_password = session["password"]
    conn = get_db()
    cur = conn.cursor()

    email_id = str(uuid.uuid4())

    if account_password:
        cur.execute("SELECT * FROM users WHERE email = ?", (email.from_email,))
        sender_row = cur.fetchone()
        cur.execute("SELECT * FROM users WHERE email = ?", (email.to_email,))
        recipient_row = cur.fetchone()
        sender = dict(sender_row) if sender_row else None
        recipient = dict(recipient_row) if recipient_row else None

        if sender and not bcrypt.checkpw(account_password.encode('utf-8'), sender['password_hash'].encode('utf-8')):
            cur.close()
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid account password")

        has_pqc_keys = (
            sender and recipient
            and recipient.get('kyber_public_key')
            and recipient.get('x25519_public_key')
            and recipient.get('dilithium_public_key')
            and recipient.get('ed25519_public_key')
        )

        if has_pqc_keys:
            try:
                sender_salt = base64.b64decode(sender['key_salt'])
                dili_priv_bytes = decrypt_private_key(
                    sender['dilithium_private_key_enc'], account_password, sender_salt
                )
                ed25519_priv_bytes = decrypt_private_key(
                    sender['ed25519_private_key_enc'], account_password, sender_salt
                )

                recipient_pub = {
                    'kyber_pub_b64': recipient['kyber_public_key'],
                    'x25519_pub_b64': recipient['x25519_public_key'],
                }
                sender_priv = {
                    'dili_priv_b64': dili_priv_bytes.decode('utf-8'),
                    'ed25519_priv_b64': ed25519_priv_bytes.decode('utf-8'),
                }

                result = encrypt_email_body(email.body, recipient_pub, sender_priv)

                cur.execute(
                    """INSERT INTO emails
                       (id, from_email, to_email, subject, encrypted_body, signature, ed25519_sig)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (email_id, email.from_email, email.to_email, email.subject,
                     result['encrypted_body'], result['dili_sig'], result['ed25519_sig'])
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
            smtp_body = email.body
            if account_password:
                cur.execute("SELECT * FROM users WHERE email = ?", (email.to_email,))
                to_row = cur.fetchone()
                to_user = dict(to_row) if to_row else None
                if to_user and to_user.get('kyber_public_key') and to_user.get('x25519_public_key'):
                    cur.execute("SELECT * FROM users WHERE email = ?", (email.from_email,))
                    from_row = cur.fetchone()
                    from_user = dict(from_row) if from_row else None
                    if from_user:
                        f_salt = base64.b64decode(from_user['key_salt'])
                        fdili = decrypt_private_key(from_user['dilithium_private_key_enc'], account_password, f_salt)
                        fed = decrypt_private_key(from_user['ed25519_private_key_enc'], account_password, f_salt)
                        rpub = {
                            'kyber_pub_b64': to_user['kyber_public_key'],
                            'x25519_pub_b64': to_user['x25519_public_key'],
                        }
                        spriv = {
                            'dili_priv_b64': fdili.decode('utf-8'),
                            'ed25519_priv_b64': fed.decode('utf-8'),
                        }
                        enc = encrypt_email_body(email.body, rpub, spriv)
                        smtp_body = None
                        smtp_payload = {
                            "encrypted_body": enc['encrypted_body'],
                            "signature": enc['dili_sig'],
                            "ed25519_sig": enc['ed25519_sig'],
                        }

            server = smtplib.SMTP(email.smtp_host, email.smtp_port)
            server.starttls()
            server.login(email.from_email, email.smtp_password)

            msg = MIMEMultipart()
            msg['From'] = email.from_email
            msg['To'] = email.to_email

            if smtp_body is None:
                msg['Subject'] = email.subject
                msg.attach(MIMEText(
                    "This message was sent with Q-Mail post-quantum encryption.\n"
                    "Open it in Q-Mail to read it. The encrypted content is attached "
                    "as message.qmail and cannot be read as plain text.",
                    'plain'
                ))
                attachment = MIMEApplication(json.dumps(smtp_payload).encode('utf-8'), Name="message.qmail")
                attachment['Content-Disposition'] = 'attachment; filename="message.qmail"'
                msg.attach(attachment)
            else:
                msg['Subject'] = email.subject
                msg.attach(MIMEText(smtp_body, 'plain'))

            server.send_message(msg)
            server.quit()
        except Exception as e:
            print(f"SMTP error (email saved to DB): {e}")

    cur.close()
    conn.close()
    return {"message": "Email sent", "id": email_id}


def _fmt_ts(ts):
    if ts is None:
        return ""
    return ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)


def _decrypt_email_row(row: dict, user: dict, password: str, conn, peer_col: str) -> dict:
    email_data = {
        "id": row['id'],
        "from": row['from_email'],
        "to": row['to_email'],
        "subject": row['subject'],
        "body": row['body'] or "",
        "preview": "",
        "time": _fmt_ts(row['timestamp']),
        "read": row['read'],
        "encrypted": False,
        "verified": False,
    }

    if row.get('encrypted_body') and row.get('signature') and row.get('ed25519_sig'):
        email_data["encrypted"] = True
        if user and user.get('kyber_private_key_enc') and user.get('x25519_private_key_enc'):
            try:
                cur2 = conn.cursor()
                cur2.execute(f"SELECT * FROM users WHERE email = ?", (row[peer_col],))
                peer_row = cur2.fetchone()
                cur2.close()

                peer = dict(peer_row) if peer_row else None

                if peer and peer.get('dilithium_public_key') and peer.get('ed25519_public_key'):
                    key_salt = base64.b64decode(user['key_salt'])
                    kyber_priv_bytes = decrypt_private_key(
                        user['kyber_private_key_enc'], password, key_salt
                    )
                    x25519_priv_bytes = decrypt_private_key(
                        user['x25519_private_key_enc'], password, key_salt
                    )

                    recipient_priv = {
                        'kyber_priv_b64': kyber_priv_bytes.decode('utf-8'),
                        'x25519_priv_b64': x25519_priv_bytes.decode('utf-8'),
                    }
                    sender_pub = {
                        'dili_pub_b64': peer['dilithium_public_key'],
                        'ed25519_pub_b64': peer['ed25519_public_key'],
                    }

                    decrypted = decrypt_email_body(
                        row['encrypted_body'],
                        row['signature'],
                        row['ed25519_sig'],
                        recipient_priv,
                        sender_pub,
                    )
                    email_data["body"] = decrypted["body"]
                    email_data["verified"] = decrypted["verified"]
                    email_data["preview"] = decrypted["body"][:100]
            except Exception as e:
                email_data["body"] = "[Unable to decrypt - invalid key, tampered, or corrupted]"
                email_data["preview"] = "[Encrypted]"
                email_data["verified"] = False
        else:
            email_data["body"] = "[Encrypted - provide password to decrypt]"
            email_data["preview"] = "[Encrypted]"
    else:
        email_data["preview"] = (row['body'] or "")[:100]

    return email_data


def _authenticate(cur, email: str, password: str) -> dict:
    """Look up the user and verify the password. Raises 401 if wrong."""
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user_row = cur.fetchone()
    user = dict(user_row) if user_row else None
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


@app.post("/emails")
def get_emails(session: dict = Depends(_require_session)):
    email = session["email"]
    conn = get_db()
    cur = conn.cursor()
    try:
        user = _authenticate(cur, email, session["password"])
    except HTTPException:
        cur.close()
        conn.close()
        raise
    cur.execute(
        "SELECT * FROM emails WHERE to_email = ? ORDER BY timestamp DESC",
        (email,)
    )
    rows = [dict(r) for r in cur.fetchall()]

    result = [_decrypt_email_row(r, user, session["password"], conn, 'from_email') for r in rows]

    cur.close()
    conn.close()
    return result


@app.post("/emails/sent")
def get_sent_emails(session: dict = Depends(_require_session)):
    email = session["email"]
    conn = get_db()
    cur = conn.cursor()
    try:
        user = _authenticate(cur, email, session["password"])
    except HTTPException:
        cur.close()
        conn.close()
        raise
    cur.execute(
        "SELECT * FROM emails WHERE from_email = ? ORDER BY timestamp DESC",
        (email,)
    )
    rows = [dict(r) for r in cur.fetchall()]

    result = [_decrypt_email_row(r, user, session["password"], conn, 'to_email') for r in rows]

    cur.close()
    conn.close()
    return result


@app.get("/public-keys/{email}")
def get_public_keys(email: str):
    email = email.strip().lower()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT kyber_public_key, dilithium_public_key, x25519_public_key, ed25519_public_key, fingerprint FROM users WHERE email = ?",
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
        "x25519_pub": result['x25519_public_key'],
        "ed25519_pub": result['ed25519_public_key'],
        "fingerprint": result['fingerprint'],
    }


@app.delete("/emails/{email_id}")
def delete_email(email_id: str, session: dict = Depends(_require_session)):
    email = session["email"]
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT from_email, to_email FROM emails WHERE id = ?", (email_id,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Email not found")
    if row['from_email'] != email and row['to_email'] != email:
        cur.close()
        conn.close()
        raise HTTPException(status_code=403, detail="Not your email")

    cur.execute("DELETE FROM emails WHERE id = ?", (email_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Email deleted", "id": email_id}


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