from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union


class TableRow(BaseModel):
    id: int
    sno: int
    capacity: Optional[float] = None
    group: str
    ppaMerchant: str
    type: str
    solar: Optional[float] = None
    wind: Optional[float] = None
    spv: str
    locationCode: str
    location: str
    pss: str
    connectivity: str
    # Allow extra fields just in case
    class Config:
        extra = "allow"

class TableDataRequest(BaseModel):
    fiscalYear: str
    data: List[TableRow]

class DropdownOptions(BaseModel):
    fiscalYear: Optional[str] = "FY_25"
    groups: List[str]
    ppaMerchants: List[str]
    types: List[str]
    locationCodes: List[str]
    locations: List[str]
    connectivities: List[str]
    # Allow extra fields for dynamic options
    class Config:
        extra = "allow"

class LocationRelationship(BaseModel):
    location: str
    locationCode: str

class RestoreBackupRequest(BaseModel):
    fiscalYear: str
    version: int

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
    created_at: str

# For login response
class LoginResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"

class Variable(BaseModel):
    key: str
    value: Any
    user_id: Optional[str] = None