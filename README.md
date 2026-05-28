# SpeakBack

SpeakBack is an AI-assisted speech therapy practice platform for stroke survivors. Patients complete guided speech exercises at home using their camera and microphone. Their therapist monitors progress through a dashboard and receives weekly PDF reports.

> **Important:** SpeakBack is a practice companion — it does not replace a licensed speech-language pathologist or therapist. All exercises should be performed under guidance from a qualified healthcare professional.

---

## What it does

- **Patients** log in, complete daily guided speech exercises (7 categories: oral motor, coordination, loudness, articulation, speech rate, functional phrases, read-aloud), and track their own progress.
- **Therapists** view a patient grid, review score history, and generate/download weekly PDF progress reports.
- **AI scoring** uses Groq Whisper for transcription, NLTK cmudict for phoneme scoring, and MediaPipe (browser-side) for oral motor exercises.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite |
| Backend | FastAPI + Python 3.11 |
| Database | MongoDB (Motor async driver) |
| Transcription | Groq API (whisper-large-v3-turbo) |
| Face/Oral Motor | MediaPipe Tasks Vision (browser WebAssembly) |
| PDF Reports | ReportLab |
| Auth | JWT (python-jose + bcrypt) |
| Storage | Cloudflare R2 (boto3) |

---

## Project structure

```
stroke-rehab-ai/
├── backend/          # FastAPI server
├── frontend/         # React + Vite app
├── .gitignore
└── README.md
```

See `backend/README.md`, `frontend/README.md`, and `database/README.md` for setup instructions.

---

## Quick start

1. Start MongoDB locally (default port 27017).
2. Set up the backend — see `backend/README.md`.
3. Set up the frontend — see `frontend/README.md`.
4. Open `http://localhost:5173` in your browser.
