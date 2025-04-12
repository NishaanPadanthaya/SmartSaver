from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..models.budget import Budget, BudgetCreate, BudgetUpdate
from ..config.db import get_collection
from ..routes.auth import get_current_user
import datetime

router = APIRouter()

@router.post("/", response_model=Budget)
async def create_budget(budget: BudgetCreate, current_user: dict = Depends(get_current_user)):
    budget_collection = await get_collection("budgets")
    
    new_budget = Budget(
        user_id=current_user["_id"],
        name=budget.name,
        total_amount=budget.total_amount,
        start_date=budget.start_date,
        end_date=budget.end_date,
        categories=budget.categories
    )
    
    budget_dict = new_budget.dict(by_alias=True)
    
    result = await budget_collection.insert_one(budget_dict)
    
    created_budget = await budget_collection.find_one({"_id": result.inserted_id})
    
    return created_budget

@router.get("/", response_model=List[Budget])
async def get_budgets(current_user: dict = Depends(get_current_user)):
    budget_collection = await get_collection("budgets")
    
    budgets = await budget_collection.find({"user_id": current_user["_id"]}).to_list(None)
    
    return budgets

@router.get("/{budget_id}", response_model=Budget)
async def get_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
    budget_collection = await get_collection("budgets")
    
    budget = await budget_collection.find_one({"_id": budget_id, "user_id": current_user["_id"]})
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return budget

@router.put("/{budget_id}", response_model=Budget)
async def update_budget(budget_id: str, budget_update: BudgetUpdate, current_user: dict = Depends(get_current_user)):
    budget_collection = await get_collection("budgets")
    
    # Check if the budget exists and belongs to user
    budget = await budget_collection.find_one({"_id": budget_id, "user_id": current_user["_id"]})
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    # Filter out None values
    update_data = {k: v for k, v in budget_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.datetime.utcnow()
    
    # Update budget
    await budget_collection.update_one(
        {"_id": budget_id},
        {"$set": update_data}
    )
    
    updated_budget = await budget_collection.find_one({"_id": budget_id})
    
    return updated_budget

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
    budget_collection = await get_collection("budgets")
    
    # Check if the budget exists and belongs to user
    budget = await budget_collection.find_one({"_id": budget_id, "user_id": current_user["_id"]})
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    # Delete budget
    await budget_collection.delete_one({"_id": budget_id})
    
    return None 