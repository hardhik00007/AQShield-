from fastapi import APIRouter

from attacks.catalog import list_attack_profiles

router = APIRouter()


@router.get("")
def get_attack_catalog() -> dict[str, list[dict]]:
    return {"attacks": list_attack_profiles()}
