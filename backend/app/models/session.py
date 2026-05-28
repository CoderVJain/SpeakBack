from pydantic import BaseModel
from typing import Optional
from app.models.exercise import ExerciseBlock


class SessionSubmit(BaseModel):
    block_type: ExerciseBlock
    exercise_name: str
    expected_text: Optional[str] = None
    transcript: Optional[str] = None
    presence_detected: bool
    metric_name: str
    metric_value: float
    baseline_delta: Optional[float] = None
    audio_url: Optional[str] = None


class SessionOut(BaseModel):
    session_id: str
    patient_id: str
    block_type: ExerciseBlock
    exercise_name: str
    expected_text: Optional[str] = None
    transcript: Optional[str] = None
    presence_detected: bool
    metric_name: str
    metric_value: float
    baseline_delta: Optional[float] = None
    audio_url: Optional[str] = None
    feedback: Optional[str] = None
    timestamp: str
