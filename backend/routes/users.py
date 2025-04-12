from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from pydantic import BaseModel
from database import users_collection, is_using_memory_db
from bson import ObjectId
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import Firebase admin with error handling
try:
    from firebase_admin import auth
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Firebase admin SDK not available, using mock authentication")

router = APIRouter()
security = HTTPBearer()

class UserProfile(BaseModel):
    displayName: str
    email: str
    phoneNumber: Optional[str] = None
    monthlyIncome: Optional[float] = None
    savingsGoal: Optional[float] = None
    avatarUrl: Optional[str] = None
    bio: Optional[str] = None
    preferredCurrency: Optional[str] = "USD"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        
        # Verify Firebase token if available, or use mock for development
        if FIREBASE_AVAILABLE:
            try:
                decoded_token = auth.verify_id_token(token)
                return decoded_token
            except Exception as e:
                print(f"Token verification error: {e}")
                # For development, allow mock tokens
                if token.startswith("dev_") and len(token) > 10:
                    user_id = token.split("_")[1]
                    return {"uid": user_id, "email": f"{user_id}@example.com"}
                raise HTTPException(status_code=401, detail="Invalid token")
        else:
            # Mock authentication for development
            if token.startswith("dev_") and len(token) > 10:
                user_id = token.split("_")[1]
                return {"uid": user_id, "email": f"{user_id}@example.com"}
            # For frontend testing, accept any Bearer token
            return {"uid": token[:24], "email": f"user_{token[:8]}@example.com"}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication required")

def token_is_development_token(user):
    # Check if this is a development token
    return user.get("email", "").endswith("@example.com")

@router.post("/register")
async def register_user(current_user: dict = Depends(get_current_user)):
    """
    Register a new user in the database after Firebase authentication
    This ensures the user exists in our database after signup
    """
    user_id = current_user["uid"]
    logger.info(f"Registering user with ID: {user_id}")
    
    try:
        # Check if user already exists
        existing_user = users_collection.find_one({"firebase_uid": user_id})
        if existing_user:
            logger.info(f"User {user_id} already exists in database")
            return {"message": "User already registered", "user_id": user_id}
        
        # Create new user document
        email = current_user.get("email", f"{user_id}@example.com")
        display_name = current_user.get("name", email.split("@")[0])
        
        new_user = {
            "firebase_uid": user_id,
            "email": email,
            "display_name": display_name,
            "phone_number": current_user.get("phone_number"),
            "avatar_url": current_user.get("picture"),
            "monthly_income": 0,
            "savings_goal": 0,
            "budgets": [],
            "savings_goals": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = users_collection.insert_one(new_user)
        logger.info(f"Created new user in database with ID: {user_id}")
        
        return {
            "message": "User registered successfully",
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{user_id}")
async def get_user_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    # In development mode, allow accessing any user's data
    if current_user["uid"] != user_id and not token_is_development_token(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access this user's data")
    
    logger.info(f"Getting profile for user {user_id}")
    
    try:
        # Get user data from MongoDB
        user = users_collection.find_one({"firebase_uid": user_id})
        
        if not user:
            logger.warning(f"User {user_id} not found in database, creating profile")
            # User doesn't exist in our database yet, create them
            await register_user(current_user)
            user = users_collection.find_one({"firebase_uid": user_id})
            
            if not user:
                # Still no user, return default profile
                logger.warning(f"Failed to create user {user_id}, returning default profile")
                return {
                    "displayName": current_user.get("name", f"User {user_id}"),
                    "email": current_user.get("email", f"{user_id}@example.com"),
                    "phoneNumber": None,
                    "monthlyIncome": 0,
                    "savingsGoal": 0,
                    "avatarUrl": None,
                    "bio": None,
                    "preferredCurrency": "USD"
                }
        
        logger.info(f"Found user profile for {user_id}")
        
        return {
            "displayName": user.get("display_name"),
            "email": user.get("email"),
            "phoneNumber": user.get("phone_number"),
            "monthlyIncome": user.get("monthly_income"),
            "savingsGoal": user.get("savings_goal"),
            "avatarUrl": user.get("avatar_url"),
            "bio": user.get("bio"),
            "preferredCurrency": user.get("preferred_currency", "USD")
        }
    except Exception as e:
        logger.error(f"Error retrieving user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{user_id}")
async def update_user_profile(
    user_id: str,
    profile: UserProfile,
    current_user: dict = Depends(get_current_user)
):
    if current_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user's data")
    
    logger.info(f"Updating profile for user {user_id}")
    
    try:
        # Check if user exists
        user = users_collection.find_one({"firebase_uid": user_id})
        if not user:
            logger.warning(f"User {user_id} not found when updating profile, creating user")
            # Create user if they don't exist
            await register_user(current_user)
        
        # Update user profile data
        update_data = {
            "display_name": profile.displayName,
            "email": profile.email,
            "phone_number": profile.phoneNumber,
            "monthly_income": profile.monthlyIncome,
            "savings_goal": profile.savingsGoal,
            "avatar_url": profile.avatarUrl,
            "bio": profile.bio,
            "preferred_currency": profile.preferredCurrency,
            "updated_at": datetime.now().isoformat()
        }
        
        result = users_collection.update_one(
            {"firebase_uid": user_id},
            {"$set": update_data},
            upsert=True  # Create user if they don't exist
        )
        
        logger.info(f"Profile update result: modified_count={result.modified_count}, upserted_id={getattr(result, 'upserted_id', None)}")
        
        # Verify profile was updated
        updated_user = users_collection.find_one({"firebase_uid": user_id})
        if updated_user:
            if updated_user.get("display_name") == profile.displayName:
                logger.info(f"Verified profile update for user {user_id}")
            else:
                logger.warning(f"Profile update verification failed for user {user_id}")
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{user_id}/dashboard")
async def get_user_dashboard(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user dashboard with combined profile, budget and savings data"""
    # In development mode, allow accessing any user's data
    if current_user["uid"] != user_id and not token_is_development_token(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access this user's data")
    
    logger.info(f"Getting dashboard for user {user_id}")
    
    try:
        # Get user data from MongoDB
        user = users_collection.find_one({"firebase_uid": user_id})
        
        if not user:
            logger.warning(f"User {user_id} not found for dashboard view")
            return {
                "profile": {
                    "displayName": current_user.get("name", f"User {user_id}"),
                    "email": current_user.get("email", f"{user_id}@example.com"),
                    "monthlyIncome": 0,
                    "savingsGoal": 0
                },
                "budgets": [],
                "savings_goals": [],
                "total_budget": 0,
                "total_savings": 0
            }
        
        # Calculate totals
        budgets = user.get("budgets", [])
        savings_goals = user.get("savings_goals", [])
        
        total_budget = sum(b.get("amount", 0) for b in budgets)
        total_budget_spent = sum(b.get("spent", 0) for b in budgets)
        
        total_savings_goal = sum(g.get("target_amount", 0) for g in savings_goals)
        total_savings_current = sum(g.get("current_amount", 0) for g in savings_goals)
        
        return {
            "profile": {
                "displayName": user.get("display_name"),
                "email": user.get("email"),
                "phoneNumber": user.get("phone_number"),
                "monthlyIncome": user.get("monthly_income"),
                "savingsGoal": user.get("savings_goal"),
                "avatarUrl": user.get("avatar_url")
            },
            "budgets": budgets[:5],  # Return only the 5 most recent budgets
            "savings_goals": savings_goals[:5],  # Return only the 5 most recent goals
            "total_budget": total_budget,
            "total_budget_spent": total_budget_spent,
            "total_savings_goal": total_savings_goal,
            "total_savings_current": total_savings_current,
            "budget_count": len(budgets),
            "savings_count": len(savings_goals)
        }
    except Exception as e:
        logger.error(f"Error retrieving user dashboard: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}") 