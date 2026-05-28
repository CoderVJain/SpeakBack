# SpeakBack — Frontend

React 19 + Vite single-page application for SpeakBack.

> **Note:** SpeakBack is a practice companion and does not replace a licensed speech-language pathologist or therapist.

---

## Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:8000`

---

## Setup

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

---

## Build for production

```bash
npm run build
```

Output goes to `frontend/dist/`. Deploy to Vercel or any static host.

---

## Key dependencies

| Package | Purpose |
|---------|---------|
| react 19 | UI framework |
| react-router-dom 7 | Client-side routing |
| @mediapipe/tasks-vision | Browser-side face/oral motor detection (WebAssembly) |
| chart.js + react-chartjs-2 | Score history charts |
| axios | API calls to backend |

---

## Folder structure

```
src/
├── api/          # Axios wrappers (auth, patients, sessions, therapist)
├── components/   # Reusable components (Camera, AudioRecorder, exercises/)
│   └── exercises/   # One component per exercise type
├── pages/
│   ├── patient/  # Dashboard, Session, ProfileSetup, Exercise
│   └── therapist/   # Dashboard, PatientDetail
├── store/        # Zustand auth store
└── utils/        # faceLandmarker singleton
```

---

## Environment

No frontend `.env` needed. The backend URL is hardcoded to `http://localhost:8000` via Vite's dev proxy. Change `src/api/*.js` base URL for a different backend host.

---

## MediaPipe WASM

WASM files are served locally from `public/wasm/` (copied from `node_modules/@mediapipe/tasks-vision/`). The face landmark model loads from Google's stable CDN URL at runtime. If you upgrade `@mediapipe/tasks-vision`, re-copy the WASM files.
