import subprocess
import shutil

print("ffmpeg in PATH:", shutil.which("ffmpeg"))

try:
    result = subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    print("ffmpeg works:", result.stdout[:50])
except Exception as e:
    print("ffmpeg error:", e)
