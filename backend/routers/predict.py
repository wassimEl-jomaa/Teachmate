from fastapi import APIRouter
from pydantic import BaseModel, Field
from . import typing as _  # optional to silence linters
from ..services.inference import predict_one

router = APIRouter(prefix="/predict", tags=["predict"])

class Features(BaseModel):
    topic: str = Field(..., description="Algebra, Geometri, Ekvationer, Procent, Statistik & Sannolikhet, Funktioner, Problemlösning")
    difficulty_1to5: int
    steps_count: int
    steps_completeness: float
    reasoning_quality: float
    method_appropriateness: float
    representation_use: float
    explanation_clarity: float
    units_handling: float
    edge_case_handling: float
    language_quality: float
    computational_errors: int
    conceptual_errors: int
    correctness_pct: float
    time_minutes: int
    external_aid_suspected: float
    originality_score: float
    rubric_points: float

@router.post("")
def post_predict(item: Features):
    pred, probs = predict_one(item.dict())
    return {"prediction": pred, "probabilities": probs}