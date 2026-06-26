from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.services.auth_service import auth_service

router = APIRouter()

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    """Register a new user on the platform."""
    try:
        result = await auth_service.register_user(
            email=user.email,
            password=user.password,
            first_name=user.first_name,
            last_name=user.last_name
        )
        return {"message": "User registered successfully", "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(credentials: UserLogin):
    """Authenticate a user and return JWT tokens."""
    try:
        result = await auth_service.login_user(
            email=credentials.email,
            password=credentials.password
        )
        return {"message": "Login successful", "session": result}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials or " + str(e))
