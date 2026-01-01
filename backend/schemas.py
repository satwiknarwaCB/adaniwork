from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union



# --- Legacy Schemas Removed ---

class User(BaseModel):
    username: str
    email: str
    password: str

# For user registration (password will be hashed)
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

# For user login
class UserLogin(BaseModel):
    email: str
    password: str

# For user response (without password)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str = "viewer"  # 'admin' or 'viewer'
    created_at: str

# For login response
class LoginResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"


# --- Legacy Variable Schema Removed ---

# Commissioning Status Models
class CommissioningProject(BaseModel):
    id: Optional[int] = None
    sno: int
    projectName: str
    spv: str
    projectType: str  # PPA, Merchant, Group
    plotLocation: str  # Plot / Location / PSS
    capacity: float
    planActual: str  # 'Plan', 'Rephase', 'Actual'
    apr: Optional[float] = None
    may: Optional[float] = None
    jun: Optional[float] = None
    jul: Optional[float] = None
    aug: Optional[float] = None
    sep: Optional[float] = None
    oct: Optional[float] = None
    nov: Optional[float] = None
    dec: Optional[float] = None
    jan: Optional[float] = None
    feb: Optional[float] = None
    mar: Optional[float] = None
    totalCapacity: Optional[float] = None
    cummTillOct: Optional[float] = None
    q1: Optional[float] = None
    q2: Optional[float] = None
    q3: Optional[float] = None
    q4: Optional[float] = None
    category: str  # 'Khavda Solar', 'Rajasthan Solar', 'Khavda Wind', etc.
    section: str  # 'A', 'B', 'C', 'D1', 'D2'
    includedInTotal: bool = True  # Whether to include in total calculations
    
    class Config:
        extra = "allow"

class CommissioningSummary(BaseModel):
    id: Optional[int] = None
    category: str  # 'Plan', 'PPA', 'Merchant', 'Group', 'Rephase', 'Actual/Fcst'
    summaryType: str  # 'Overall', 'Solar', 'Wind'
    apr: Optional[float] = None
    may: Optional[float] = None
    jun: Optional[float] = None
    jul: Optional[float] = None
    aug: Optional[float] = None
    sep: Optional[float] = None
    oct: Optional[float] = None
    nov: Optional[float] = None
    dec: Optional[float] = None
    jan: Optional[float] = None
    feb: Optional[float] = None
    mar: Optional[float] = None
    total: Optional[float] = None
    cummTillOct: Optional[float] = None
    q1: Optional[float] = None
    q2: Optional[float] = None
    q3: Optional[float] = None
    q4: Optional[float] = None
    
    class Config:
        extra = "allow"

class CommissioningDataRequest(BaseModel):
    fiscalYear: str
    projects: List[CommissioningProject]
    summaries: List[CommissioningSummary]