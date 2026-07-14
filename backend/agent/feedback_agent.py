"""AI Feedback Agent.

After a patient finishes an exercise, this generates 2-3 warm, encouraging
sentences plus one specific tip. For articulation words it looks at which sound
was mispronounced so the tip targets that exact sound.

Uses Groq (llama-3.1-8b-instant) — fast and high daily limit. Falls back to a
plain template if the API is unavailable so the patient always sees feedback.
"""

from app.ml.transcription import get_client
from app.ml.phoneme import _word_to_phonemes

MODEL = "llama-3.1-8b-instant"

SYSTEM_PROMPT = (
    "You are a compassionate speech therapist helping a stroke survivor practice "
    "at home. Write 2-3 short, warm, encouraging sentences about their attempt, "
    "then one specific tip to improve next time. Keep it simple and positive. "
    "Never mention scores, numbers, or medical diagnoses. Do not use emojis."
)


def _sound_hint(expected_word: str, transcript: str) -> str:
    """Return a short note on the first mispronounced sound, or empty string."""
    if not expected_word or not transcript.strip():
        return ""
    heard = transcript.strip().lower().split()[0]
    expected_ph = _word_to_phonemes(expected_word)
    heard_ph = _word_to_phonemes(heard)
    for e, h in zip(expected_ph, heard_ph):
        if e != h:
            return f'The target sound "{e}" came out closer to "{h}".'
    if len(heard_ph) < len(expected_ph):
        missing = expected_ph[len(heard_ph)]
        return f'The sound "{missing}" was dropped.'
    return ""


def _build_user_prompt(block_type, expected_text, transcript, sound_hint) -> str:
    lines = [
        f"Exercise type: {block_type}",
        f'Asked to say: "{expected_text or "(free speech)"}"',
        f'They said: "{transcript or "(nothing heard)"}"',
    ]
    if sound_hint:
        lines.append(f"Sound detail: {sound_hint}")
    return "\n".join(lines)


def _template_feedback(metric_value: float) -> str:
    if metric_value >= 80:
        return ("Wonderful work - that was clear and strong. "
                "Keep practicing a little each day to hold onto this progress.")
    if metric_value >= 50:
        return ("Nice effort - you are making real progress. "
                "Try saying it slowly and a bit louder next time.")
    return ("Thank you for trying - every attempt helps you recover. "
            "Take a breath, go slowly, and give it another go next time.")


def generate_feedback(
    block_type: str,
    expected_text: str,
    transcript: str,
    metric_value: float,
) -> str:
    """Generate encouraging feedback for one exercise attempt."""
    sound_hint = ""
    if block_type == "articulation":
        sound_hint = _sound_hint(expected_text, transcript or "")

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(
                    block_type, expected_text, transcript, sound_hint)},
            ],
            temperature=0.7,
            max_tokens=120,
        )
        text = response.choices[0].message.content.strip()
        return text or _template_feedback(metric_value)
    except Exception:
        return _template_feedback(metric_value)
