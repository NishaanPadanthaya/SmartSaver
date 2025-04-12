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

class BudgetItem(BaseModel):
    name: str
    limit: float
    color: str
    spent: Optional[float] = 0

class Budget(BaseModel):
    name: str
    total_amount: float
    start_date: str
    end_date: str
    categories: List[BudgetItem]

class BudgetCreate(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None
    period: Optional[str] = None

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    spent: Optional[float] = None
    description: Optional[str] = None
    period: Optional[str] = None

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
async def get_budgets(user_id: str, current_user: dict = Depends(get_current_user)):
    # In development mode, allow accessing any user's data
    if current_user["uid"] != user_id and not token_is_development_token(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access this user's data")
    
    logger.info(f"Getting budgets for user {user_id}")
    
    try:
        user = users_collection.find_one({"firebase_uid": user_id})
        logger.info(f"User found: {user is not None}")
        
        if not user:
            logger.info(f"No user found with ID {user_id}, returning empty list")
            return []
        
        budgets = user.get("budgets", [])
        logger.info(f"Found {len(budgets)} budgets for user {user_id}")
        return budgets
    except Exception as e:
        logger.error(f"Error getting budgets: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{user_id}")
async def create_budget(
    user_id: str, 
    budget: BudgetCreate,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Creating budget for user {user_id}: {budget.dict()}")
    
    if current_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user's data")
    
    try:
        # Find the user
        user = users_collection.find_one({"firebase_uid": user_id})
        if not user:
            logger.warning(f"User {user_id} not found, creating new user record")
            # Create user if not exists
            new_user = {"firebase_uid": user_id, "budgets": []}
            users_collection.insert_one(new_user)
            logger.info(f"Created new user record for {user_id}")
        
        # Convert budget to dict and add _id
        budget_dict = budget.dict()
        budget_dict["_id"] = str(ObjectId())
        budget_dict["spent"] = 0
        budget_dict["created_at"] = datetime.now().isoformat()
        budget_dict["updated_at"] = datetime.now().isoformat()
        
        # Add budget to user's budgets
        result = users_collection.update_one(
            {"firebase_uid": user_id},
            {"$push": {"budgets": budget_dict}},
            upsert=True
        )
        
        logger.info(f"Budget creation result: modified_count={result.modified_count}, upserted_id={getattr(result, 'upserted_id', None)}")
        
        # Verify budget was created by fetching user again
        updated_user = users_collection.find_one({"firebase_uid": user_id})
        if updated_user:
            budgets = updated_user.get("budgets", [])
            created_budget = next((b for b in budgets if b.get("_id") == budget_dict["_id"]), None)
            if created_budget:
                logger.info(f"Verified budget creation for user {user_id}")
            else:
                logger.warning(f"Budget created but not found in user document for user {user_id}")
        
        return {"message": "Budget created successfully", "budget_id": budget_dict["_id"]}
    except Exception as e:
        logger.error(f"Error creating budget: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{user_id}/{budget_id}")
async def update_budget(
    user_id: str,
    budget_id: str,
    budget: BudgetUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user's data")
    
    logger.info(f"Updating budget {budget_id} for user {user_id}")
    
    try:
        # First check if the budget exists
        user = users_collection.find_one({"firebase_uid": user_id})
        if not user:
            logger.warning(f"User {user_id} not found when updating budget {budget_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        budgets = user.get("budgets", [])
        budget_exists = any(b.get("_id") == budget_id for b in budgets)
        
        if not budget_exists:
            logger.warning(f"Budget {budget_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Budget not found")
        
        # Update the budget
        # Filter out None values
        update_data = {k: v for k, v in budget.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now().isoformat()
        
        # Create a $set object with dotted notation for nested updates
        set_dict = {f"budgets.$.{key}": value for key, value in update_data.items()}
        
        result = users_collection.update_one(
            {"firebase_uid": user_id, "budgets._id": budget_id},
            {"$set": set_dict}
        )
        
        logger.info(f"Budget update result: modified_count={result.modified_count}")
        
        if result.modified_count == 0:
            logger.warning(f"Budget {budget_id} not updated for user {user_id}")
            raise HTTPException(status_code=404, detail="Budget not found or not modified")
        
        # Verify update
        updated_user = users_collection.find_one({"firebase_uid": user_id})
        updated_budgets = updated_user.get("budgets", [])
        updated_budget = next((b for b in updated_budgets if b.get("_id") == budget_id), None)
        
        if updated_budget:
            logger.info(f"Verified budget update for user {user_id}, budget {budget_id}")
        else:
            logger.warning(f"Budget updated but verification failed for user {user_id}, budget {budget_id}")
        
        return {"message": "Budget updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating budget: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{user_id}/{budget_id}")
async def delete_budget(
    user_id: str,
    budget_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["uid"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this user's data")
    
    logger.info(f"Deleting budget {budget_id} for user {user_id}")
    
    try:
        # Check if the budget exists
        user = users_collection.find_one({"firebase_uid": user_id})
        if not user:
            logger.warning(f"User {user_id} not found when deleting budget {budget_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        budgets = user.get("budgets", [])
        budget_exists = any(b.get("_id") == budget_id for b in budgets)
        
        if not budget_exists:
            logger.warning(f"Budget {budget_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Budget not found")
        
        # Delete the budget
        result = users_collection.update_one(
            {"firebase_uid": user_id},
            {"$pull": {"budgets": {"_id": budget_id}}}
        )
        
        logger.info(f"Budget deletion result: modified_count={result.modified_count}")
        
        if result.modified_count == 0:
            logger.warning(f"Budget {budget_id} not deleted for user {user_id}")
            raise HTTPException(status_code=404, detail="Budget not found or not deleted")
        
        # Verify deletion
        updated_user = users_collection.find_one({"firebase_uid": user_id})
        updated_budgets = updated_user.get("budgets", [])
        budget_still_exists = any(b.get("_id") == budget_id for b in updated_budgets)
        
        if not budget_still_exists:
            logger.info(f"Verified budget deletion for user {user_id}, budget {budget_id}")
        else:
            logger.warning(f"Budget deletion verification failed for user {user_id}, budget {budget_id}")
        
        return {"message": "Budget deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting budget: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}") 