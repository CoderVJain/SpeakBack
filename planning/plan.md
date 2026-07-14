# SpeakBack — AI and Agentic AI Plan

This plan lists AI features we can add to SpeakBack. The focus is on things that run
**automatically** (agents that do work on their own), and on **real problems in
healthcare today**, not just nice-to-have chat features.

SpeakBack stays a *practice helper*. The AI never diagnoses. A real speech therapist
always makes the final call. The AI does the routine work and asks the therapist to
approve anything important.

---

## The problems in healthcare today (and how we help)

- **Not enough speech therapists.** Stroke patients get far less practice than they
  need, especially in small towns. If the app can handle the daily routine on its own,
  one therapist can look after many more patients.
- **Patients stop practicing at home.** Most home programs are abandoned. Instant
  feedback and reminders keep patients going.
- **Therapists drown in paperwork.** Notes and reports take hours. The app can write
  the first draft for them.
- **Insurance pays for remote monitoring** — but only if the app automatically records
  how often the patient practiced and how they are doing.
- **A sudden drop in speech can be a warning sign** (like a second stroke). The app can
  catch this early and alert the therapist fast.

**Which feature solves which problem** (all from the "Features to build" list below):

| Problem | Feature(s) that solve it |
|---------|--------------------------|
| Not enough speech therapists | #2 Adaptive Curriculum (one therapist covers many) + #3 Monitor and Safety (points their time at who needs it) |
| Patients stop practicing at home | #1 Feedback Agent (instant encouragement) + #5 Adherence Agent (reminders) |
| Therapists drown in paperwork | #4 Documentation Agent (writes the first draft of notes and reports) |
| Insurance pays only with a practice record | #4 Documentation Agent (practice/adherence log) |
| A sudden speech drop is a warning sign | #3 Monitor and Safety Agent (nightly check + urgent alert) |

Every problem maps to at least one feature. #1 Feedback Agent is built; #2–#6 are planned
in the build order at the end of this document.

---

## How the app works now vs. what we want

**Now (passive):** patient records → app transcribes → app scores → saves it → makes a
weekly PDF. Nothing reacts. Nothing adapts.

**Goal (automatic loop):** every time a patient finishes a session, a chain of small AI
agents runs on its own — score it, give feedback, plan tomorrow, update the notes. A
separate agent checks all patients every night. The therapist only steps in to approve
the important things.

---

## Features to build

Each feature below says **what it does**, **why it matters**, and **how it fits the
code we already have**.

### 1. Feedback Agent (build first)
- **What:** Right after a patient finishes an exercise, an AI writes 2–3 short, kind
  sentences plus one clear tip. The tip is specific — it looks at *which sound* the
  patient got wrong (for example, they said "pat" instead of "bat") and gives advice
  for that exact sound.
- **Why:** Patients keep practicing when they get instant, encouraging feedback. This
  is the smallest change with the biggest effect on daily use.
- **How:** New file `backend/agent/feedback_agent.py`. Call it inside `submit_session`
  in `app/api/sessions.py`. Save the text into the `feedback` field that already exists
  on the session. Use the phoneme comparison we already do in `app/ml/phoneme.py` to
  find the wrong sound.

### 2. Adaptive Curriculum Agent (auto-plans tomorrow)
- **What:** After each session, an AI decides what tomorrow's practice should be — which
  sounds to focus on and whether to make it easier or harder — based on how the patient
  has been doing.
- **Why:** Every patient recovers differently. Fixed rules can't adapt to one person.
  This personalizes practice with no therapist effort.
- **How:** We already have a rule-based picker in `app/services/selection.py`. Keep it,
  and let the agent *use it as a tool* — the agent chooses the settings (focus sounds,
  level, difficulty mix), the picker still chooses the actual words. Moving a patient up
  a level is not automatic: it sets the `promotion_flag` (already in the code) so the
  therapist approves it.

### 3. Monitor and Safety Agent (runs every night, on its own)
- **What:** Once a night, an AI looks at every patient's recent sessions and spots
  problems: scores dropping, sessions being skipped, or a sudden big drop that could be a
  medical warning. It builds a short "who needs attention" list for the therapist and
  sends an urgent alert for serious drops.
- **Why:** Therapists can't watch every patient every day. This points their limited
  time at the patients who need it, and catches warning signs early.
- **How:** A scheduled background job (FastAPI background task or a cron). It writes its
  findings into a new `patient_alerts` collection, which the therapist dashboard shows
  as a ranked list. Serious cases also trigger an email.

### 4. Documentation Agent (writes notes and reports)
- **What:** The AI writes the first draft of the clinical notes and the weekly progress
  summary in plain sentences ("Priya practiced 5 of 7 days; her 'b' sound improved from
  62 to 81"). It also keeps a simple log of how often the patient practiced and how they
  scored — the record insurance needs to pay for remote monitoring.
- **Why:** Saves the therapist hours of paperwork, and the practice log is what makes the
  program billable and sustainable for a clinic.
- **How:** Upgrade `app/services/report_generator.py` so the PDF starts with an
  AI-written summary above the current tables. Add a small monitoring log built from the
  session history we already store.

### 5. Adherence Agent (gentle reminders)
- **What:** When a patient starts skipping sessions, the AI sends a friendly reminder.
  If they had a rough day, it can quietly make the next session a bit easier so they
  don't give up.
- **Why:** The main reason home therapy fails is people stop doing it. Automatic,
  personal nudges keep them going with no therapist effort.
- **How:** A scheduled check on missed sessions, reusing the same session history and the
  curriculum agent's difficulty control.

### 6. Voice Quality Scoring (makes every agent smarter)
- **What:** Right now we only check *what words* the patient said. This adds a check on
  *how* they said it — long pauses, shaky or flat voice, speaking too slowly. These are
  the real signs of speech trouble after a stroke.
- **Why:** It's the biggest blind spot in our current scoring, and it gives all the other
  agents a much better picture of the patient — including early signs of decline that the
  words alone can't show.
- **How:** New file `app/ml/acoustics.py` that measures these from the audio we already
  receive (using a library like `parselmouth`/Praat). Feed the numbers into scoring and
  into the feedback, curriculum, and monitor agents.

---

## Which free API to use for each feature

We use three free APIs. Each has different strengths, so we match the feature to the
right one. All three speak the same OpenAI-style format, so we can write one client and
switch providers easily.

**The free limits (2026), in plain terms:**
- **Groq** — very fast. Small model (`llama-3.1-8b-instant`): ~14,400 calls/day, 30/min.
  Big model (`llama-3.3-70b`): only ~1,000/day. Whisper speech-to-text: 2,000/day.
- **Gemini** — good at thinking and long text. `Gemini 3 Flash`: 1,500 calls/day, 10/min,
  huge context. (`Flash-Lite`: 1,000/day, 15/min.)
- **OpenRouter** — a gateway to many free models (DeepSeek R1, Llama 3.3 70B). Only
  50 calls/day free (1,000/day after a one-time $10 top-up), 20/min. Best kept as a
  backup when the other two run out.

**Match each feature to an API:**

| Feature | How often it runs | Best free API | Why | Backup |
|---------|-------------------|---------------|-----|--------|
| Transcription (already built) | Every recording | **Groq Whisper** | Only free fast speech-to-text; 2,000/day | (record & retry) |
| 1. Feedback Agent | Many times per session (highest volume) | **Groq `llama-3.1-8b-instant`** | 14,400/day and fast; text is short and simple | Gemini Flash-Lite, then OpenRouter |
| 2. Adaptive Curriculum Agent | Once per session | **Gemini 3 Flash** | Needs real reasoning; low volume fits 1,500/day | Groq `llama-3.3-70b`, then OpenRouter DeepSeek R1 |
| 3. Monitor & Safety Agent | Once a night per patient | **Gemini 3 Flash** | Needs reasoning + long history in one call | Groq `llama-3.3-70b`, then OpenRouter |
| 4. Documentation Agent | Weekly / per session | **Gemini 3 Flash** | Long, well-written notes; big context | OpenRouter Llama 3.3 70B |
| 5. Adherence Agent | Occasionally (missed days) | **Groq `llama-3.1-8b-instant`** | Short reminder text, low volume | Gemini Flash-Lite |
| 6. Voice Quality Scoring | Every recording | **No API** | This is audio math (`parselmouth`/Praat), not an LLM | none needed |

**Why this split works:** the one high-volume feature (Feedback) goes to Groq's small
model, which has by far the most daily calls. The "thinking" features are low volume, so
Gemini's smaller 1,500/day budget is plenty. OpenRouter sits underneath everything as a
safety net.

## Handling rate limits and fallback

Free tiers run out, so every AI call goes through **one shared helper** that:
1. **Tries the primary API** for that feature (from the table above).
2. **On a "too many requests" (429) error, waits a moment and retries;** if it keeps
   failing, it **switches to the backup API** automatically.
3. **If all APIs are exhausted, uses a plain template** (a fixed encouraging message, or
   simply queues the work for later) so the app never breaks in front of the patient.

Two things keep us well under the limits:
- **Batch calls.** For Feedback, send all of a session's words in one request and get all
  the feedback back together, instead of one call per word. This turns ~10 calls into 1.
- **Spread the load.** High-frequency work goes to Groq (big daily budget), thinking work
  goes to Gemini (small budget but low volume). They rarely compete for the same limit.

## Safety
- The AI never changes anything clinical on its own — level-ups and alerts wait for the
  therapist to approve.
- Before trusting any agent, test it on a small set of known examples so a change to the
  prompt or model can't quietly make it worse.
- For agents whose output feeds the code (curriculum settings, alert flags), ask the API
  for **JSON output** (Groq and Gemini both support this) so the result is reliable.

---

## Build order (one small step at a time, test each before the next)
1. Feedback Agent — proves the automatic loop, helps patients right away.
2. Documentation Agent (summary part) — reuses report data, saves therapist time.
3. Voice Quality Scoring — better signal for everything after.
4. Adaptive Curriculum Agent — wrap the existing picker, therapist approves level-ups.
5. Monitor and Safety Agent — nightly checks, alerts, and the attention list.
6. Documentation Agent (practice log) — the record needed for insurance.
7. Adherence Agent — automatic reminders.
