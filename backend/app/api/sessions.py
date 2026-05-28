import random
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from app.models.session import SessionSubmit, SessionOut
from app.models.exercise import ExerciseBlock, EXERCISE_LIBRARY
from app.api.deps import get_current_user
from app.db.database import get_db
from app.services.selection import select_content_for_session

router = APIRouter(prefix="/sessions", tags=["sessions"])

FIXED_BLOCK_ORDER = [
    (ExerciseBlock.oral_motor, 2),
    (ExerciseBlock.coordination_ddk, 1),
    (ExerciseBlock.loudness, 1),
]

ROTATED_BLOCKS = [
    ExerciseBlock.articulation,
    ExerciseBlock.speech_rate,
    ExerciseBlock.functional_phrases,
    ExerciseBlock.read_aloud,
]


@router.get("/guided-session")
async def get_guided_session(current_user=Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Patients only")

    db = get_db()
    patient_id = str(current_user["_id"])

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    done_today = await db.sessions.count_documents({
        "patient_id": patient_id,
        "timestamp": {"$gte": today_start.isoformat()},
    })
    if done_today > 0:
        raise HTTPException(status_code=400, detail="session_already_done_today")

    profile = await db.patient_profiles.find_one({"patient_id": patient_id}) or {}

    content = await select_content_for_session(db, patient_id, profile)

    last_selection = await db.session_selections.find_one(
        {"patient_id": patient_id},
        sort=[("timestamp", -1)]
    )
    recent_exercises = set(last_selection.get("exercise_set", [])) if last_selection else set()

    exercises = []
    selected_exercise_names = []

    for block, count in FIXED_BLOCK_ORDER:
        pool = EXERCISE_LIBRARY.get(block, [])
        fresh = [ex for ex in pool if ex["name"] not in recent_exercises]
        if len(fresh) < count:
            fresh = pool
        selected = random.sample(fresh, min(count, len(fresh)))
        for ex in selected:
            selected_exercise_names.append(ex["name"])
            exercises.append({
                "block_type": block,
                "exercise_name": ex["name"],
                "instruction": ex["instruction"],
                "target_text": ex.get("target_text"),
                "target_items": None,
                "duration_seconds": ex["duration_seconds"],
                "metric_name": ex["metric_name"],
            })

    await db.session_selections.insert_one({
        "patient_id": patient_id,
        "exercise_set": selected_exercise_names,
        "word_set": [w["word"] for w in content["words"]],
        "phrase_set": [p["text"] for p in content["phrases"]],
        "rate_set": [p["text"] for p in content["rate_phrases"]],
        "sentence_set": [s["text"] for s in content["sentences"]],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    art_template = EXERCISE_LIBRARY[ExerciseBlock.articulation][0]
    exercises.append({
        "block_type": ExerciseBlock.articulation,
        "exercise_name": art_template["name"],
        "instruction": art_template["instruction"],
        "target_text": None,
        "target_items": [w["word"] for w in content["words"]],
        "duration_seconds": art_template["duration_seconds"],
        "metric_name": art_template["metric_name"],
    })

    rate_template = EXERCISE_LIBRARY[ExerciseBlock.speech_rate][0]
    exercises.append({
        "block_type": ExerciseBlock.speech_rate,
        "exercise_name": rate_template["name"],
        "instruction": rate_template["instruction"],
        "target_text": None,
        "target_items": [p["text"] for p in content["rate_phrases"]],
        "duration_seconds": rate_template["duration_seconds"],
        "metric_name": rate_template["metric_name"],
    })

    phrase_template = EXERCISE_LIBRARY[ExerciseBlock.functional_phrases][0]
    exercises.append({
        "block_type": ExerciseBlock.functional_phrases,
        "exercise_name": phrase_template["name"],
        "instruction": phrase_template["instruction"],
        "target_text": None,
        "target_items": [p["text"] for p in content["phrases"]],
        "duration_seconds": phrase_template["duration_seconds"],
        "metric_name": phrase_template["metric_name"],
    })

    sent_template = EXERCISE_LIBRARY[ExerciseBlock.read_aloud][0]
    exercises.append({
        "block_type": ExerciseBlock.read_aloud,
        "exercise_name": sent_template["name"],
        "instruction": sent_template["instruction"],
        "target_text": None,
        "target_items": [s["text"] for s in content["sentences"]],
        "duration_seconds": sent_template["duration_seconds"],
        "metric_name": sent_template["metric_name"],
    })

    return {"exercises": exercises, "total": len(exercises)}


@router.post("/submit", response_model=SessionOut)
async def submit_session(data: SessionSubmit, current_user=Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can submit sessions")
    db = get_db()
    patient_id = str(current_user["_id"])
    doc = {
        "patient_id": patient_id,
        "block_type": data.block_type,
        "exercise_name": data.exercise_name,
        "expected_text": data.expected_text,
        "transcript": data.transcript,
        "presence_detected": data.presence_detected,
        "metric_name": data.metric_name,
        "metric_value": round(data.metric_value, 2),
        "baseline_delta": data.baseline_delta,
        "audio_url": data.audio_url,
        "feedback": None,
        "timestamp": datetime.utcnow().isoformat(),
    }
    result = await db.sessions.insert_one(doc)
    return SessionOut(session_id=str(result.inserted_id), **doc)


@router.get("/my", response_model=List[SessionOut])
async def get_my_sessions(current_user=Depends(get_current_user)):
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Patients only")
    db = get_db()
    patient_id = str(current_user["_id"])
    cursor = db.sessions.find({"patient_id": patient_id}).sort("timestamp", -1)
    sessions = []
    async for s in cursor:
        sessions.append(SessionOut(
            session_id=str(s["_id"]),
            patient_id=s["patient_id"],
            block_type=s.get("block_type", "read_aloud"),
            exercise_name=s.get("exercise_name", ""),
            expected_text=s.get("expected_text"),
            transcript=s.get("transcript"),
            presence_detected=s.get("presence_detected", True),
            metric_name=s.get("metric_name", "Word Error Rate (WER)"),
            metric_value=s.get("metric_value", s.get("pronunciation_score", 0)),
            baseline_delta=s.get("baseline_delta"),
            audio_url=s.get("audio_url"),
            feedback=s.get("feedback"),
            timestamp=s["timestamp"],
        ))
    return sessions


@router.get("/patient/{patient_id}", response_model=List[SessionOut])
async def get_patient_sessions(patient_id: str, current_user=Depends(get_current_user)):
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Therapists only")
    db = get_db()
    cursor = db.sessions.find({"patient_id": patient_id}).sort("timestamp", -1)
    sessions = []
    async for s in cursor:
        sessions.append(SessionOut(
            session_id=str(s["_id"]),
            patient_id=s["patient_id"],
            block_type=s.get("block_type", "read_aloud"),
            exercise_name=s.get("exercise_name", ""),
            expected_text=s.get("expected_text"),
            transcript=s.get("transcript"),
            presence_detected=s.get("presence_detected", True),
            metric_name=s.get("metric_name", "Word Error Rate (WER)"),
            metric_value=s.get("metric_value", s.get("pronunciation_score", 0)),
            baseline_delta=s.get("baseline_delta"),
            audio_url=s.get("audio_url"),
            feedback=s.get("feedback"),
            timestamp=s["timestamp"],
        ))
    return sessions

