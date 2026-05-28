from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from app.ml.presence import detect_presence
from app.ml.transcription import transcribe_audio
from app.ml.scoring import score_pronunciation, count_ddk_repetitions, score_speech_rate
from app.api.deps import get_current_user

router = APIRouter(prefix="/ml", tags=["ml"])


class PresenceRequest(BaseModel):
    frame_b64: str


@router.post("/presence")
async def check_presence(data: PresenceRequest, current_user=Depends(get_current_user)):
    try:
        present = detect_presence(data.frame_b64)
        return {"present": present}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process frame: {str(e)}")


class ScoreRequest(BaseModel):
    transcript: str
    expected: str


@router.post("/score")
async def score(data: ScoreRequest, current_user=Depends(get_current_user)):
    result = score_pronunciation(data.transcript, data.expected)
    return {"score": result}


@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not file.filename.endswith((".wav", ".mp3", ".webm", ".m4a", ".ogg")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")
    try:
        audio_bytes = await file.read()
        extension = file.filename.rsplit(".", 1)[-1]
        transcript = transcribe_audio(audio_bytes, extension)
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")



class DDKRequest(BaseModel):
    transcript: str
    target_syllable: str


@router.post("/ddk-count")
async def ddk_count(data: DDKRequest, current_user=Depends(get_current_user)):
    count = count_ddk_repetitions(data.transcript, data.target_syllable)
    return {"count": count, "metric_name": "DDK Rate (repetitions per 10 seconds)"}


class SpeechRateRequest(BaseModel):
    transcript: str
    duration_seconds: float
    target_wpm_min: Optional[int] = 80
    target_wpm_max: Optional[int] = 120


@router.post("/speech-rate")
async def speech_rate(data: SpeechRateRequest, current_user=Depends(get_current_user)):
    result = score_speech_rate(
        data.transcript,
        data.duration_seconds,
        data.target_wpm_min,
        data.target_wpm_max,
    )
    return result


@router.post("/phoneme")
async def phoneme_score(
    file: UploadFile = File(...),
    expected_word: str = "",
    current_user=Depends(get_current_user),
):
    if not expected_word:
        raise HTTPException(status_code=400, detail="expected_word is required")
    try:
        from app.ml.phoneme import score_phoneme_from_transcript
        audio_bytes = await file.read()
        extension = file.filename.rsplit(".", 1)[-1]
        transcript = transcribe_audio(audio_bytes, extension)
        result = score_phoneme_from_transcript(transcript, expected_word)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Phoneme scoring failed: {str(e)}")
