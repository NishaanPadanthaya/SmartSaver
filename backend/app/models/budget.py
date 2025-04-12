from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId
from .user import PyObjectId

class BudgetCategory(BaseModel):
    name: str
    limit: float
    color: Optional[str] = "#6366F1"  # Default indigo color
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

class Budget(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    name: str
    total_amount: float
    start_date: datetime
    end_date: datetime
    categories: List[BudgetCategory] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

class BudgetCreate(BaseModel):
    name: str
    total_amount: float
    start_date: datetime
    end_date: datetime
    categories: List[BudgetCategory] = []

class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    total_amount: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    categories: Optional[List[BudgetCategory]] = None
    
    class Config:
        arbitrary_types_allowed = True

class SavingsGoal(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    name: str
    target_amount: float
    current_amount: float = 0
    target_date: Optional[datetime] = None
    category: Optional[str] = None
    priority: Optional[str] = "Medium"  # Low, Medium, High
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }

class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    target_date: Optional[datetime] = None
    category: Optional[str] = None
    priority: Optional[str] = "Medium"
    notes: Optional[str] = None

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[datetime] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True 