# SpeakBack — AI Agents and Workflow

This document describes the AI agents in SpeakBack: what each one does, how the AI is
implemented, and why it is useful. It is the working reference for the agentic layer.

SpeakBack stays a *practice helper*. The AI never diagnoses. A real speech therapist
always makes the final call. The agents do the routine work and ask the therapist to
approve anything important.

---

## The workflow (automatic loop)

Every time a patient finishes a session, a chain of small agents runs on its own. Each
agent has one job, uses a free LLM API, and falls back to a plain template if the API is
unavailable so the patient never sees a broken screen.

```
Patient finishes exercise
        |
        v
  POST /sessions/submit
        |
        v
  [Feedback Agent]  --> warm feedback + one targeted tip   (BUILT)
        |
        v
  Saved to session doc  --> shown on the results screen
        |
        v
  (planned) Curriculum Agent --> plans tomorrow
  (planned) Documentation Agent --> drafts notes
  (planned) Monitor Agent (nightly) --> flags patients at risk
```

**Status:** the Feedback Agent is built and live. The remaining agents (Curriculum,
Documentation, Monitor, Adherence, Voice Quality) are planned — see `plan.md`.

---

## Agent 1 — Feedback Agent (built)

### What it is
Right after a patient finishes an exercise, this agent writes 2–3 short, warm,
encouraging sentences plus one specific tip. For articulation words the tip is targeted:
it looks at *which sound* the patient got wrong (for example, they said "pat" instead of
"bat") and gives advice for that exact sound. It never mentions scores or numbers, so the
patient only sees kind, human-sounding guidance.

### How the AI is implemented
- **File:** `backend/agent/feedback_agent.py`, function `generate_feedback(...)`.
- **Model:** Groq `llama-3.1-8b-instant` — fast and a high daily free limit (~14,400
  calls/day), which suits the highest-volume feature.
- **Prompt design:** a fixed system prompt casts the model as a compassionate speech
  therapist and constrains the output (2–3 sentences, one tip, no scores, no emojis). A
  per-attempt user prompt supplies the exercise type, the target text, what the patient
  said, and — for articulation — a "sound detail" line.
- **Sound targeting (the smart part):** `_sound_hint(...)` reuses the existing phoneme
  comparison in `app/ml/phoneme.py`. It converts the target word and what was heard into
  phonemes, finds the first mismatch (e.g. target "B" came out as "P") or a dropped
  sound, and feeds that fact to the model so the tip is specific instead of generic.
- **Reliability:** the LLM call is wrapped so that any failure (network, rate limit,
  empty response) falls back to `_template_feedback(...)` — a fixed encouraging message
  chosen by score tier. The patient always gets feedback.
- **Where it runs:** called inside `submit_session` in `app/api/sessions.py`; the text is
  saved into the `feedback` field on the session document.
- **Frontend:** the results screen (`frontend/src/pages/patient/Session.jsx`,
  `SessionSummary`) reads each session's `feedback` and shows it under the score card.

### Why it is useful
- **Keeps patients practicing.** The main reason home speech therapy fails is that people
  stop. Instant, personal, encouraging feedback is the smallest change with the biggest
  effect on daily use.
- **Targeted, not generic.** Because it names the exact mispronounced sound, the tip is
  genuinely helpful — closer to what a real therapist would say than a canned "good job".
- **Always works.** The template fallback means an API outage or exhausted free tier
  never blocks the patient's session.
- **Proves the automatic loop.** It is the first link in the agent chain and shows the
  pattern the other agents follow: one job, one API, a safe fallback.

---

## Notes for adding future agents
When each planned agent is built, add a section here in the same shape:
**What it is → How the AI is implemented → Why it is useful.** Keep the workflow diagram
above updated as agents move from planned to built.
