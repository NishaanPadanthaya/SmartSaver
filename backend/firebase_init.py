import firebase_admin
from firebase_admin import credentials, auth
import os
import json

# Initialize Firebase Admin SDK
def initialize_firebase():
    try:
        # Try to use service account key file
        service_account_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
        print(f"Initializing Firebase with service account from: {service_account_path}")
        
        # Check if file exists
        if not os.path.exists(service_account_path):
            raise FileNotFoundError(f"Service account file not found at {service_account_path}")
        
        # Initialize using a global variable to track initialization
        global _firebase_app
        
        # Initialize only if not already initialized
        try:
            # This will fail if Firebase is not initialized
            auth.get_user('test_non_existent_user_just_for_checking')
            print("Firebase already initialized")
        except (ValueError, firebase_admin.exceptions.FirebaseError):
            # Not yet initialized, so initialize
            cred = credentials.Certificate(service_account_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            print("Firebase initialized successfully")
        except Exception as e:
            print(f"Firebase check failed with error: {e}")
            # Initialize anyway, the SDK will handle duplicate initialization
            cred = credentials.Certificate(service_account_path)
            try:
                _firebase_app = firebase_admin.initialize_app(cred)
                print("Firebase initialized successfully")
            except Exception as init_error:
                print(f"Firebase initialization error: {init_error}")
                raise init_error
            
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        raise e

# Global variable to track initialization
_firebase_app = None

# Initialize Firebase on module import
try:
    initialize_firebase()
except Exception as e:
    print(f"Warning: Firebase initialization error: {e}")
    # Don't re-raise to allow the application to start even with Firebase issues

# Function to verify ID token
def verify_token(token):
    try:
        decoded_token = auth.verify_id_token(token)
        print(f"Token verified for user: {decoded_token.get('uid', 'unknown')}")
        return decoded_token
    except Exception as e:
        print(f"Token verification error: {e}")
        raise e 