from fastapi import APIRouter

from backend.app.services.protocol_registry import list_protocols


router = APIRouter()


@router.get("")
def get_protocols() -> dict[str, list[dict[str, str]]]:
    return {"protocols": list_protocols()}
