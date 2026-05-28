from pydantic import BaseModel
from typing import List, Optional


class TherapistProfileCreate(BaseModel):
    license_number: str
    specialization: Optional[str] = None


class TherapistProfileOut(BaseModel):
    therapist_id: str
    name: str
    email: str
    license_number: str
    specialization: Optional[str] = None
    patient_ids: List[str] = []
