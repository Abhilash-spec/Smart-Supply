import uuid
from typing import Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client, Client
from pydantic import BaseModel, EmailStr

from app.core.config import settings

class AuthService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    async def register_user(self, email: str, password: str, first_name: str, last_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Register a new user using Supabase Auth.
        """
        response = self.supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "first_name": first_name,
                    "last_name": last_name
                }
            }
        })
        return response.model_dump()

    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate a user and return session tokens.
        """
        response = self.supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return response.model_dump()

    async def get_user_roles(self, db: AsyncSession, user_id: uuid.UUID) -> list:
        """
        Retrieve RBAC roles for a given user from the database.
        """
        # In a real app, query the user_roles table
        # stmt = select(Role).join(UserRole).where(UserRole.user_id == user_id)
        # result = await db.execute(stmt)
        # return result.scalars().all()
        return [{"name": "admin", "permissions": ["read:all", "write:all"]}]

auth_service = AuthService()
