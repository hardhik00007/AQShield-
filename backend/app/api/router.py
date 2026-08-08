from fastapi import APIRouter

from backend.app.api.routes import attacks, experiments, health, metrics, protocols, quantum, runs


api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(protocols.router, prefix="/protocols", tags=["protocols"])
api_router.include_router(attacks.router, prefix="/attacks", tags=["attacks"])
api_router.include_router(runs.router, prefix="/runs", tags=["runs"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(quantum.router, prefix="/quantum", tags=["quantum"])
api_router.include_router(
    experiments.router, prefix="/experiments", tags=["experiments"]
)
