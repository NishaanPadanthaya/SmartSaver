import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv
import os
import json

load_dotenv()

# Check if Firebase credentials are available
firebase_credentials = os.getenv("FIREBASE_CREDENTIALS")

# Initialize Firebase Admin SDK
if firebase_credentials:
    try:
        # Try to parse JSON string from environment variable
        cred_dict = json.loads(firebase_credentials)
        cred = credentials.Certificate(cred_dict)
    except:
        # If not a valid JSON string, assume it's a path to the credentials file
        cred = credentials.Certificate(firebase_credentials)
    
    firebase_admin.initialize_app(cred)
else:
    # For development, you may use a service account key file
    try:
        cred = credentials.Certificate("backend//serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    except:
        print("WARNING: Firebase credentials not found. Authentication will not work correctly.")

def verify_token(token: str):
    """
    Verify Firebase ID token
    """
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Token verification error: {e}")
        return None 