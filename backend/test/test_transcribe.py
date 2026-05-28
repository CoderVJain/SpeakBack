import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.transcription import transcribe_audio

with open("test/test_presence.py", "rb") as f:
    audio_bytes = f.read()

try:
    result = transcribe_audio(audio_bytes, "py")
    print("Result:", result)
except Exception as e:
    import traceback
    traceback.print_exc()
