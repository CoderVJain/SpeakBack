from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserLogin, Token, UserOut
from app.core.security import hash_password, verify_password, create_access_token
from app.db.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate):
    db = get_db()
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": data.role,
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id, "role": data.role})
    user_out = UserOut(id=user_id, name=data.name, email=data.email, role=data.role)
    return Token(access_token=token, user=user_out)


@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "role": user["role"]})
    user_out = UserOut(id=user_id, name=user["name"], email=user["email"], role=user["role"])
    return Token(access_token=token, user=user_out)


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return UserOut(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
    )
