from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
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

class SavingsGoal(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    target_date: Optional[str] = None
    description: Optional[str] = None

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

@router.get("/{user_id}")
async def get_savings_goals(user_id: str, current_user: dict = Depends(get_current_user)):
    # In development mode, allow accessing any user's data
    if current_user["uid"] != user_id and not token_is_development_token(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access this user's data")
    
    logger.info(f"Getting savings goals for user {user_id}")
    
    try:
        user = users_collection.find_one({"firebase_uid": user_id})
        logger.info(f"User found: {user is not None}")
        
        if not user:
            logger.info(f"No user found with ID {user_id}, returning empty list")
            return []
        
        goals = user.get("savings_goals", [])
        logger.info(f"Found {len(goals)} savings goals for user {user_id}")
        return goals
    except Exception as e:
        logger.error(f"Error getting savings goals: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{user_id}")
async def create_savings_goal(
    user_id: str,
    goal: SavingsGoal,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Creating savings goal for user {user_id}: {goal.dict()}")
    
    if current_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user's data")
    
    try:
        # Find the user
        user = users_collection.find_one({"firebase_uid": user_id})
        if not user:
            logger.warning(f"User {user_id} not found, creating new user record")
            # Create user if not exists
            new_user = {"firebase_uid": user_id, "savings_goals": []}
            users_collection.insert_one(new_user)
            logger.info(f"Created new user record for {user_id}")
        
        # Convert goal to dict and add _id
        goal_dict = goal.dict()
        goal_dict["_id"] = str(ObjectId())
        goal_dict["current_amount"] = 0
        goal_dict["created_at"] = datetime.now().isoformat()
        goal_dict["updated_at"] = datetime.now().isoformat()
        
        # Add goal to user's savings_goals
        result = users_collection.update_one(
            {"firebase_uid": user_id},
            {"$push": {"savings_goals": goal_dict}},
            upsert=True
        )
        
        logger.info(f"Savings goal creation result: modified_count={result.modified_count}, upserted_id={getattr(result, 'upserted_id', None)}")
        
        # Verify goal was created by fetching user again
        updated_user = users_collection.find_one({"firebase_uid": user_id})
        if updated_user:
            goals = updated_user.get("savings_goals", [])
            created_goal = next((g for g in goals if g.get("_id") == goal_dict["_id"]), None)
            if created_goal:
                logger.info(f"Verified goal creation for user {user_id}")
            else:
                logger.warning(f"Goal created but not found in user document for user {user_id}")
        
        return {"message": "Savings goal created successfully", "goal_id": goal_dict["_id"]}
    except Exception as e:
        logger.error(f"Error creating savings goal: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{user_id}/{goal_id}")
async def update_savings_goal(
    user_id: str,
    goal_id: str,
    goal: SavingsGoal,
    current_user: dict = Depends(get_current_user)
):
    if current_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user's data")
    
    logger.info(f"Updating savings goal {goal_id} for user {user_id}")
    
    try:
        # First check if the goal exists
        user = users_collection.find_one({"firebase_uid": user_id})
        if not user:
            logger.warning(f"User {user_id} not found when updating goal {goal_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        goals = user.get("savings_goals", [])
        goal_exists = any(g.get("_id") == goal_id for g in goals)
        
        if not goal_exists:
            logger.warning(f"Goal {goal_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Savings goal not found")
        
        # Update the goal
        goal_dict = goal.dict()
        goal_dict["updated_at"] = datetime.now().isoformat()
        
        result = users_collection.update_one(
            {"firebase_uid": user_id, "savings_goals._id": goal_id},
            {"$set": {f"savings_goals.$.{key}": value for key, value in goal_dict.items()}}
        )
        
        logger.info(f"Savings goal update result: modified_count={result.modified_count}")
        
        if result.modified_count == 0:
            logger.warning(f"Goal {goal_id} not updated for user {user_id}")
            raise HTTPException(status_code=404, detail="Savings goal not found or not modified")
        
        # Verify update
        updated_user = users_collection.find_one({"firebase_uid": user_id})
        updated_goals = updated_user.get("savings_goals", [])
        updated_goal = next((g for g in updated_goals if g.get("_id") == goal_id), None)
        
        if updated_goal:
            logger.info(f"Verified goal update for user {user_id}, goal {goal_id}")
        else:
            logger.warning(f"Goal updated but verification failed for user {user_id}, goal {goal_id}")
        
        return {"message": "Savings goal updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating savings goal: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{user_id}/{goal_id}")
async def delete_savings_goal(
    user_id: str,
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user's data")
    
    logger.info(f"Deleting savings goal {goal_id} for user {user_id}")
    
    try:
        # Check if the goal exists
        user = users_collection.find_one({"firebase_uid": user_id})
        if not user:
            logger.warning(f"User {user_id} not found when deleting goal {goal_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        goals = user.get("savings_goals", [])
        goal_exists = any(g.get("_id") == goal_id for g in goals)
        
        if not goal_exists:
            logger.warning(f"Goal {goal_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Savings goal not found")
        
        # Delete the goal
        result = users_collection.update_one(
            {"firebase_uid": user_id},
            {"$pull": {"savings_goals": {"_id": goal_id}}}
        )
        
        logger.info(f"Savings goal deletion result: modified_count={result.modified_count}")
        
        if result.modified_count == 0:
            logger.warning(f"Goal {goal_id} not deleted for user {user_id}")
            raise HTTPException(status_code=404, detail="Savings goal not found or not deleted")
        
        # Verify deletion
        updated_user = users_collection.find_one({"firebase_uid": user_id})
        updated_goals = updated_user.get("savings_goals", [])
        goal_still_exists = any(g.get("_id") == goal_id for g in updated_goals)
        
        if not goal_still_exists:
            logger.info(f"Verified goal deletion for user {user_id}, goal {goal_id}")
        else:
            logger.warning(f"Goal deletion verification failed for user {user_id}, goal {goal_id}")
        
        return {"message": "Savings goal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting savings goal: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}") 