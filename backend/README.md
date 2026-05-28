# SpeakBack — Backend

FastAPI server powering the SpeakBack platform.

> **Note:** SpeakBack is a practice companion and does not replace a licensed speech-language pathologist or therapist.

---

## Prerequisites

- Python 3.11
- MongoDB running locally (default port 27017)
- ffmpeg installed and available on PATH

---

## Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create your .env file
copy .env.example .env
# Edit .env and fill in your GROQ_API_KEY and other values

# Start the server
uvicorn main:app --reload
```

API available at `http://localhost:8000`.  
Swagger docs at `http://localhost:8000/docs`.

---

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB connection string (default: `mongodb://localhost:27017/strokerehab`) |
| `SECRET_KEY` | JWT signing secret — use a long random string in production |
| `GROQ_API_KEY` | Groq API key for Whisper transcription |
| `IMAGEKIT_*` | ImageKit credentials for file storage |

---

## Folder structure

```
backend/
├── main.py                  # FastAPI app, CORS, router registration
├── requirements.txt         # Python dependencies
├── seed_content.py          # One-time script to seed exercise words/phrases
├── .env.example             # Environment variable template
└── app/
    ├── api/                 # Route handlers (auth, patients, therapists, sessions, ml, reports)
    ├── core/                # Config (settings from .env), security (JWT)
    ├── db/                  # MongoDB connection (Motor async)
    ├── ml/                  # ML logic: transcription (Groq Whisper), phoneme scoring (NLTK)
    ├── models/              # Pydantic models
    └── services/            # Business logic: selection algorithm, PDF report generator
```

---

## Seeding content

Run once after the database is ready:

```bash
python seed_content.py
```

This inserts 210 words, 50 phrases, and 40 sentences into the `content_bank` collection.

---

## Key API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register patient or therapist |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/sessions/guided-session` | Get today's exercise set for patient |
| POST | `/sessions/` | Submit a completed session |
| GET | `/sessions/my` | Patient's own session history |
| POST | `/ml/transcribe` | Transcribe audio via Groq Whisper |
| POST | `/ml/score` | Score pronunciation (WER-based) |
| POST | `/ml/phoneme` | Score phoneme articulation (NLTK cmudict) |
| GET | `/reports/weekly` | Generate weekly PDF for a patient |
