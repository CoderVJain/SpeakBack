import tempfile
import os
from groq import Groq
from app.core.config import settings

_client = None


def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def transcribe_audio(audio_bytes: bytes, extension: str = "wav") -> str:
    with tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        client = get_client()
        with open(tmp_path, "rb") as f:
            result = client.audio.transcriptions.create(
                file=(f"audio.{extension}", f),
                model="whisper-large-v3-turbo",
                language="en",
                response_format="text",
            )
        return result.strip() if isinstance(result, str) else result.text.strip()
    finally:
        os.unlink(tmp_path)
