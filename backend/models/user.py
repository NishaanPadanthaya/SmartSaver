from sqlalchemy import Column, String, Float, Integer
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    display_name = Column(String)
    phone_number = Column(String, nullable=True)
    monthly_income = Column(Float, nullable=True)
    savings_goal = Column(Float, nullable=True) 