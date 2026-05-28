import re
import nltk
from nltk.corpus import cmudict

nltk.download("cmudict", quiet=True)

_cmu = None


def _get_cmu():
    global _cmu
    if _cmu is None:
        _cmu = cmudict.dict()
    return _cmu


def _word_to_phonemes(word: str) -> list:
    cmu = _get_cmu()
    entries = cmu.get(word.lower(), [])
    if not entries:
        return list(word.lower())
    return [p.rstrip("012") for p in entries[0]]


def _phoneme_edit_distance(seq1: list, seq2: list) -> int:
    m, n = len(seq1), len(seq2)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[:]
        dp[0] = i
        for j in range(1, n + 1):
            if seq1[i - 1] == seq2[j - 1]:
                dp[j] = prev[j - 1]
            else:
                dp[j] = 1 + min(prev[j], dp[j - 1], prev[j - 1])
    return dp[n]


def score_phoneme_from_transcript(transcript: str, expected_word: str) -> dict:
    """
    Score pronunciation using Groq Whisper transcript vs expected word.
    Groq handles transcription — this function only does phoneme comparison.
    """
    raw = transcript.strip().lower().split()[0] if transcript.strip() else ""
    heard_word = re.sub(r'[^\w]', '', raw)

    expected_phonemes = _word_to_phonemes(expected_word)
    heard_phonemes = _word_to_phonemes(heard_word) if heard_word else []

    if not expected_phonemes:
        return {"phoneme_score": 0.0, "transcript": transcript}

    edit_dist = _phoneme_edit_distance(heard_phonemes, expected_phonemes)
    score = round(max(0.0, (1.0 - edit_dist / max(len(expected_phonemes), 1)) * 100), 1)

    return {"phoneme_score": score, "transcript": transcript}
