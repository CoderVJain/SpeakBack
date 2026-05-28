# SpeakBack — Database

SpeakBack uses **MongoDB** (accessed via Motor, the async Python driver).

> The MongoDB database is named `strokerehab` internally. This is the storage layer name and is not shown to users — the product name presented in the UI and reports is **SpeakBack**.

---

## Requirements

- MongoDB 6+ (local or Atlas)
- Default local URL: `mongodb://localhost:27017/strokerehab`

---

## Quick start (local)

1. Install MongoDB Community Edition and start `mongod`.
2. The backend creates collections automatically on first run — no manual setup needed.
3. Run `seed_content.py` once to populate the exercise content bank:

```bash
cd backend
venv\Scripts\activate
python seed_content.py
```

---

## Collections

| Collection | Description |
|------------|-------------|
| `users` | All accounts (patients and therapists). Role field: `patient` or `therapist`. |
| `patient_profiles` | Patient medical profile: diagnosis date, affected side, therapist link, level, word quotas. |
| `sessions` | Each completed exercise attempt: block type, exercise name, score, transcript, timestamp. |
| `session_selections` | Per-patient daily exercise set (prevents warm-up repetition across sessions). |
| `content_bank` | Seeded words, phrases, and sentences used for articulation/rate/phrase/read-aloud exercises. |

---

## Schema notes

### `users`

```json
{
  "_id": "ObjectId",
  "email": "string",
  "hashed_password": "string",
  "role": "patient | therapist",
  "full_name": "string",
  "patient_ids": ["ObjectId"]   // therapist only — linked patients
}
```

### `sessions`

```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId",
  "block_type": "articulation | speech_rate | ...",
  "exercise_name": "string",
  "metric_name": "wer_score | phoneme_score | ...",
  "metric_value": 0.0,
  "expected_text": "string",
  "transcript": "string",
  "presence_detected": true,
  "timestamp": "ISO-8601 datetime"
}
```

### `content_bank`

```json
{
  "_id": "ObjectId",
  "type": "word | phrase | sentence",
  "text": "string",
  "target_sounds": ["p", "b"],
  "difficulty": "easy | medium | hard"
}
```

---

## MongoDB Atlas (production)

Replace `MONGO_URL` in `.env` with your Atlas connection string:

```
MONGO_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/strokerehab
```

No other changes needed — Motor handles both local and Atlas connections identically.

---

## Indexes (recommended for production)

```javascript
db.sessions.createIndex({ patient_id: 1, timestamp: -1 })
db.users.createIndex({ email: 1 }, { unique: true })
db.content_bank.createIndex({ type: 1, difficulty: 1 })
```
