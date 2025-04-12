# This file makes the database directory a Python package 

from pymongo import MongoClient
from dotenv import load_dotenv
import os
import logging
from typing import Dict, List, Any
import time
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure, OperationFailure

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize collection variable
users_collection = None

# Get MongoDB URI from environment variable or use default
MONGODB_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("DB_NAME", "smartsaver")

# Print masked version of URI for debugging
masked_uri = MONGODB_URI
if "@" in masked_uri:
    # Mask the username and password in the URI
    parts = masked_uri.split("@")
    auth_part = parts[0].split("://")[1].split(":")
    if len(auth_part) > 1:
        # Has username and password
        masked_uri = masked_uri.replace(auth_part[0] + ":" + auth_part[1], "****:****")
    else:
        # Has only username
        masked_uri = masked_uri.replace(auth_part[0], "****")

logger.info(f"Connecting to MongoDB with URI: {masked_uri}")
logger.info(f"Using database: {DB_NAME}")

# No fallback - directly connect to MongoDB
# Increase timeout and add retry settings
client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=20000,
    connectTimeoutMS=30000,
    socketTimeoutMS=45000,
    retryWrites=True,
    maxPoolSize=50
)

# Force a connection to verify that the server is available
logger.info("Testing MongoDB connection...")
client.admin.command('ping')

# Get info about the server
server_info = client.server_info()
logger.info(f"Connected to MongoDB version: {server_info.get('version', 'unknown')}")

# Get database
db = client[DB_NAME]
logger.info(f"Using database: {DB_NAME}")

# Check if database exists by listing collections
collections = db.list_collection_names()
logger.info(f"Collections in database: {collections}")

# Collections
users_collection = db.users
print("\n" + "="*50)
print("🔌 CONNECTED TO MONGODB ATLAS SUCCESSFULLY 🔌")
print(f"DATABASE: {DB_NAME}")
print(f"COLLECTIONS: {collections}")
print("="*50 + "\n")

# Function for compatibility - always returns False
def is_using_memory_db():
    return False