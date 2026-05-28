from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class AffectedSide(str, Enum):
    left = "left"
    right = "right"
    both = "both"


class PatientProfileCreate(BaseModel):
    diagnosis_date: str
    affected_side: AffectedSide
    therapist_name: Optional[str] = None
    notes: Optional[str] = None
    focus_sounds: List[str] = ["P", "B"]
    level: int = 1
    words_per_session: int = 5
    phrases_per_session: int = 3


class PatientProfileOut(BaseModel):
    patient_id: str
    name: str
    email: str
    diagnosis_date: str
    affected_side: AffectedSide
    therapist_id: Optional[str] = None
    notes: Optional[str] = None
    focus_sounds: List[str] = ["P", "B"]
    level: int = 1
    words_per_session: int = 5
    phrases_per_session: int = 3
    promotion_flag: bool = False


class PatientProfilePatch(BaseModel):
    focus_sounds: Optional[List[str]] = None
    level: Optional[int] = None
    words_per_session: Optional[int] = None
    phrases_per_session: Optional[int] = None
