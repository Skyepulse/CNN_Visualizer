from dotenv import load_dotenv
import os

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "dbname": os.getenv("DB_NAME", "postgres")
}

BACKEND_PORT = int(os.getenv("BACKEND_PORT", 5000))

BACKEND_PROXY_HEADERS = int(os.getenv("BACKEND_PROXY_HEADERS", 0)) > 0