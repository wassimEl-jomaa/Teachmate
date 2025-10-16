from pathlib import Path
import joblib
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parents[1] / "model"
_model = joblib.load(MODEL_DIR/"trained_model.pkl")
_topic_encoder = joblib.load(MODEL_DIR/"topic_encoder.pkl")
_feature_order = joblib.load(MODEL_DIR/"feature_order.pkl")

def predict_one(payload: dict):
    df = pd.DataFrame([payload])
    df["topic"] = _topic_encoder.transform(df["topic"])
    df = df[_feature_order]
    pred = _model.predict(df)[0]
    proba = _model.predict_proba(df)[0]
    classes = list(_model.classes_)
    return pred, {cls: float(p) for cls, p in zip(classes, proba)}

class InferenceService:
    def _preprocess(self, payload: Dict[str, Any]) -> pd.DataFrame:
        df = pd.DataFrame([payload])
        df["topic"] = get_topic_encoder().transform(df["topic"])
        df = df[get_feature_order()]
        return df

    def predict(self, payload: Dict[str, Any]):
        df = self._preprocess(payload)
        pred = get_model().predict(df)[0]
        proba = get_model().predict_proba(df)[0]
        classes = list(get_model().classes_)
        probs = {cls: float(p) for cls, p in zip(classes, proba)}
        return pred, probs