from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..models.budget import SavingsGoal, SavingsGoalCreate, SavingsGoalUpdate
from ..config.db import get_collection
from ..routes.auth import get_current_user
import datetime

router = APIRouter()

@router.post("/", response_model=SavingsGoal)
async def create_savings_goal(goal: SavingsGoalCreate, current_user: dict = Depends(get_current_user)):
    savings_collection = await get_collection("savings_goals")
    
    new_goal = SavingsGoal(
        user_id=current_user["_id"],
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        category=goal.category,
        priority=goal.priority,
        notes=goal.notes
    )
    
    goal_dict = new_goal.dict(by_alias=True)
    
    result = await savings_collection.insert_one(goal_dict)
    
    created_goal = await savings_collection.find_one({"_id": result.inserted_id})
    
    return created_goal

@router.get("/", response_model=List[SavingsGoal])
async def get_savings_goals(current_user: dict = Depends(get_current_user)):
    savings_collection = await get_collection("savings_goals")
    
    goals = await savings_collection.find({"user_id": current_user["_id"]}).to_list(None)
    
    return goals

@router.get("/{goal_id}", response_model=SavingsGoal)
async def get_savings_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    savings_collection = await get_collection("savings_goals")
    
    goal = await savings_collection.find_one({"_id": goal_id, "user_id": current_user["_id"]})
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )
    
    return goal

@router.put("/{goal_id}", response_model=SavingsGoal)
async def update_savings_goal(goal_id: str, goal_update: SavingsGoalUpdate, current_user: dict = Depends(get_current_user)):
    savings_collection = await get_collection("savings_goals")
    
    # Check if the goal exists and belongs to the user
    goal = await savings_collection.find_one({"_id": goal_id, "user_id": current_user["_id"]})
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )
    
    # Filter out None values
    update_data = {k: v for k, v in goal_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.datetime.utcnow()
    
    # Update goal
    await savings_collection.update_one(
        {"_id": goal_id},
        {"$set": update_data}
    )
    
    updated_goal = await savings_collection.find_one({"_id": goal_id})
    
    return updated_goal

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_savings_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    savings_collection = await get_collection("savings_goals")
    
    # Check if the goal exists and belongs to the user
    goal = await savings_collection.find_one({"_id": goal_id, "user_id": current_user["_id"]})
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found"
        )
    
    # Delete goal
    await savings_collection.delete_one({"_id": goal_id})
    
    return None 