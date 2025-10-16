import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from models import AI_Score
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from models import AI_Score

# Load model and encoders once at startup
MODEL_DIR = Path(__file__).resolve().parent.parent / "model"

# Load the trained model and encoders
model = joblib.load(MODEL_DIR / "trained_grade_model.pkl")
topic_encoder = joblib.load(MODEL_DIR / "topic_encoder.pkl")
grade_encoder = joblib.load(MODEL_DIR / "grade_encoder.pkl")

# Define the order of features expected by the model
FEATURE_ORDER = [
    "topic",
    "difficulty_1to5",
    "correctness_pct",
    "reasoning_quality",
    "steps_completeness",
    "rubric_points"
]

class ScoringResult:
    """
    Class to encapsulate the result of a scoring operation.
    """
    def __init__(self, grade, confidence, reason, model_used):
        self.grade = grade
        self.confidence = confidence
        self.reason = reason
        self.model_used = model_used



class ScoringService:
    """
    Service class for scoring submissions and managing AI_Score records.
    """
    def __init__(self):
        # Initialize the service (e.g., load models, encoders, etc.)
        pass

    def score_submission(self, submission_text: str, subject: str = "Mathematics"):
        """
        Perform feature extraction and model inference to score a submission.
        """
        # Example scoring logic (replace with real implementation)
        return {
            "grade": "A",
            "confidence": 0.95,
            "reason": "Predicted grade A with 95% confidence.",
            "model_used": "RandomForest_v1"
        }

    def create_ai_score_record(self, db: Session, submission_id: int, result: dict) -> AI_Score:
        """
        Create a new AI_Score record in the database based on the scoring result.
        """
        ai_score = AI_Score(
            homework_submission_id=submission_id,
            predicted_score=int(result["confidence"] * 100),  # Convert confidence to a percentage
            predicted_band=result["grade"],                  # Predicted grade (e.g., 'A', 'B', etc.)
            prediction_explainer=result["reason"],           # Explanation for the prediction
            prediction_model_version=result["model_used"],   # Model version used for prediction
            predicted_at=datetime.now(timezone.utc),         # Timestamp of the prediction
            confidence_level=result["confidence"],           # Confidence level (0-1)
            model_used=result["model_used"],                 # Model name/version
            analysis_data=None                               # Placeholder for additional analysis data
        )

        db.add(ai_score)
        db.commit()
        db.refresh(ai_score)

        return ai_score