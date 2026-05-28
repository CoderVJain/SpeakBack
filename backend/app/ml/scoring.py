import re
from jiwer import wer


def score_pronunciation(transcript: str, expected: str) -> float:
    if not transcript.strip() or not expected.strip():
        return 0.0
    error_rate = wer(expected.lower().strip(), transcript.lower().strip())
    return round(max(0.0, (1.0 - error_rate) * 100), 2)


def count_ddk_repetitions(transcript: str, target_syllable: str) -> int:
    if not transcript.strip():
        return 0
    text = transcript.lower().strip()
    target = target_syllable.lower().strip()
    if target == "pataka":
        matches = re.findall(r'pa[\s\-]?ta[\s\-]?ka', text)
        return len(matches) if matches else max(0, len(text.split()) // 3)
    count = len(re.findall(re.escape(target), text))
    if count == 0:
        words = text.split()
        count = sum(1 for w in words if target[0] in w and len(w) <= len(target) + 2)
    return count


def score_speech_rate(transcript: str, duration_seconds: float,
                      target_wpm_min: int = 80, target_wpm_max: int = 120) -> dict:
    words = transcript.strip().split() if transcript.strip() else []
    word_count = len(words)
    if duration_seconds <= 0:
        return {"wpm": 0, "in_range": False, "score": 0.0}
    wpm = round((word_count / duration_seconds) * 60, 1)
    in_range = target_wpm_min <= wpm <= target_wpm_max
    if in_range:
        score = 100.0
    elif wpm < target_wpm_min:
        score = round(max(0.0, (wpm / target_wpm_min) * 100), 1)
    else:
        overshoot = wpm - target_wpm_max
        score = round(max(0.0, 100.0 - (overshoot / target_wpm_max) * 100), 1)
    return {"wpm": wpm, "in_range": in_range, "score": score}
