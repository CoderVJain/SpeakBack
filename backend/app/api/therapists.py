from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from app.models.therapist import TherapistProfileCreate, TherapistProfileOut
from app.models.patient import PatientProfileOut
from app.api.deps import get_current_user
from app.db.database import get_db

router = APIRouter(prefix="/therapists", tags=["therapists"])


@router.post("/profile", response_model=TherapistProfileOut)
async def create_profile(data: TherapistProfileCreate, current_user=Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Only therapists can create a therapist profile")

    db = get_db()
    user_id = str(current_user["_id"])

    existing = await db.therapist_profiles.find_one({"therapist_id": user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    doc = {
        "therapist_id": user_id,
        "license_number": data.license_number,
        "specialization": data.specialization,
        "patient_ids": [],
    }
    await db.therapist_profiles.insert_one(doc)

    return TherapistProfileOut(
        therapist_id=user_id,
        name=current_user["name"],
        email=current_user["email"],
        license_number=doc["license_number"],
        specialization=doc.get("specialization"),
        patient_ids=doc.get("patient_ids", []),
    )


@router.get("/profile", response_model=TherapistProfileOut)
async def get_my_profile(current_user=Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Therapists only")

    db = get_db()
    user_id = str(current_user["_id"])
    profile = await db.therapist_profiles.find_one({"therapist_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return TherapistProfileOut(
        therapist_id=user_id,
        name=current_user["name"],
        email=current_user["email"],
        license_number=profile["license_number"],
        specialization=profile.get("specialization"),
        patient_ids=profile.get("patient_ids", []),
    )


@router.post("/link-patient/{patient_id}", response_model=TherapistProfileOut)
async def link_patient(patient_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Therapists only")

    db = get_db()
    therapist_id = str(current_user["_id"])

    patient = await db.users.find_one({"_id": ObjectId(patient_id), "role": "patient"})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    await db.therapist_profiles.update_one(
        {"therapist_id": therapist_id},
        {"$addToSet": {"patient_ids": patient_id}},
    )
    await db.patient_profiles.update_one(
        {"patient_id": patient_id},
        {"$set": {"therapist_id": therapist_id}},
    )

    profile = await db.therapist_profiles.find_one({"therapist_id": therapist_id})
    return TherapistProfileOut(
        therapist_id=therapist_id,
        name=current_user["name"],
        email=current_user["email"],
        license_number=profile["license_number"],
        specialization=profile.get("specialization"),
        patient_ids=profile.get("patient_ids", []),
    )


@router.get("/patients", response_model=List[PatientProfileOut])
async def get_my_patients(current_user=Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Therapists only")

    db = get_db()
    therapist_id = str(current_user["_id"])
    profile = await db.therapist_profiles.find_one({"therapist_id": therapist_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Therapist profile not found")

    patient_ids = profile.get("patient_ids", [])
    patients = []
    for pid in patient_ids:
        user = await db.users.find_one({"_id": ObjectId(pid)})
        p_profile = await db.patient_profiles.find_one({"patient_id": pid})
        if user and p_profile:
            patients.append(PatientProfileOut(
                patient_id=pid,
                name=user["name"],
                email=user["email"],
                diagnosis_date=p_profile["diagnosis_date"],
                affected_side=p_profile["affected_side"],
                therapist_id=p_profile.get("therapist_id"),
                notes=p_profile.get("notes"),
            ))
    return patients
