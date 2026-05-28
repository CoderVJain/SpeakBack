from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    patient = "patient"
    therapist = "therapist"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
