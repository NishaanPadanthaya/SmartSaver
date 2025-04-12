from fastapi import APIRouter, Depends, HTTPException, Header, status
from typing import Optional
from ..models.user import UserCreate, UserResponse, UserUpdate, UserInDB
from ..config.db import get_collection
from ..config.firebase import verify_token
import pymongo
from datetime import datetime

router = APIRouter()

# Helper function to get Firebase token from header
async def get_firebase_token(authorization: Optional[str] = Header(None)) -> str:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split("Bearer ")[1]
    return token

# Helper function to verify user and get Firebase UID
async def get_current_user(token: str = Depends(get_firebase_token)):
    decoded_token = verify_token(token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decoded_token

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, token: str = Depends(get_firebase_token)):
    """
    Register a new user after Firebase authentication
    """
    # Verify the token
    decoded_token = verify_token(token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    # Ensure the Firebase UID matches
    if decoded_token["uid"] != user_data.firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase UID mismatch",
        )
    
    # Check if user already exists
    users_collection = get_collection("users")
    existing_user = await users_collection.find_one({"firebase_uid": user_data.firebase_uid})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already registered",
        )
    
    # Create new user document
    new_user = UserInDB(
        firebase_uid=user_data.firebase_uid,
        email=user_data.email,
        display_name=user_data.display_name or decoded_token.get("name", ""),
        photo_url=user_data.photo_url or decoded_token.get("picture", ""),
    )
    
    # Insert into database
    result = await users_collection.insert_one(new_user.dict(by_alias=True))
    
    # Retrieve the created user
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    created_user["id"] = str(created_user["_id"])
    
    return UserResponse(**created_user)

@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the current user's profile
    """
    users_collection = get_collection("users")
    user = await users_collection.find_one({"firebase_uid": current_user["uid"]})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    user["id"] = str(user["_id"])
    return UserResponse(**user)

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the current user's profile
    """
    users_collection = get_collection("users")
    
    # Find the user
    user = await users_collection.find_one({"firebase_uid": current_user["uid"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Filter out None values
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    if not update_data:
        # No valid update data provided
        user["id"] = str(user["_id"])
        return UserResponse(**user)
    
    # Add updated_at timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    # Update the user
    await users_collection.update_one(
        {"firebase_uid": current_user["uid"]},
        {"$set": update_data}
    )
    
    # Get the updated user
    updated_user = await users_collection.find_one({"firebase_uid": current_user["uid"]})
    updated_user["id"] = str(updated_user["_id"])
    
    return UserResponse(**updated_user) 