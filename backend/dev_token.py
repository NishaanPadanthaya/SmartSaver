#!/usr/bin/env python3
"""
Development token generator for testing SmartSaver API
"""

import sys
import base64
import json
import time
import uuid

def create_dev_token(user_id=None):
    """
    Create a development token for testing
    """
    if not user_id:
        user_id = f"test_{uuid.uuid4().hex[:8]}"
    
    token = f"dev_{user_id}"
    print("\n=== DEVELOPMENT TOKEN (NOT FOR PRODUCTION) ===")
    print(f"User ID: {user_id}")
    print(f"Token: {token}")
    print("\nUse this in your Authorization header as:")
    print(f"Bearer {token}")
    print("\nExample curl command:")
    print(f'curl -H "Authorization: Bearer {token}" http://localhost:8000/api/budgets/{user_id}')
    print("==============================================\n")
    return token

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
    else:
        user_id = None
    create_dev_token(user_id) 