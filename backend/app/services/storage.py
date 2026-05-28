from imagekitio import ImageKit
from app.core.config import settings

_client = None


def get_client() -> ImageKit:
    global _client
    if _client is None:
        _client = ImageKit(private_key=settings.imagekit_private_key)
    return _client


def upload_file(file_bytes: bytes, filename: str, folder: str = "/") -> str:
    client = get_client()
    result = client.files.upload(
        file=file_bytes,
        file_name=filename,
        folder=folder,
        use_unique_file_name=False,
    )
    return result.url


def upload_audio(file_bytes: bytes, patient_id: str, session_id: str, extension: str = "wav") -> str:
    return upload_file(file_bytes, f"{session_id}.{extension}", f"/audio/{patient_id}")


def upload_report(file_bytes: bytes, patient_id: str, date_str: str) -> str:
    return upload_file(file_bytes, f"{date_str}.pdf", f"/reports/{patient_id}")
