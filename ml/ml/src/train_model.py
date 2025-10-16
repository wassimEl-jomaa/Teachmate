from pathlib import Path
import pandas as pd
import joblib
import tempfile, shutil, os

from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import classification_report

# ---- Paths ----
DATA_DIR = Path(r"C:\Users\Abo Mahmoud\Desktop\Maskininlärning_teknikhögskolan_projecktEntry tollgate\EduMate\ml\ml\data")
MODEL_DIR = Path(r"C:\Users\Abo Mahmoud\Desktop\Maskininlärning_teknikhögskolan_projecktEntry tollgate\EduMate\backend\model")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ---- Load data ----
train = pd.read_csv(DATA_DIR / "klass9_matte_inlamningar_train.csv")
test = pd.read_csv(DATA_DIR / "klass9_matte_inlamningar_test.csv")

# Features och mål
X_train = train.drop(columns=["submission_id", "grade", "teacher_comment_sv"])
y_train = train["grade"]
X_test = test.drop(columns=["submission_id", "grade", "teacher_comment_sv"])
y_test = test["grade"]

# ---- Encode 'topic' ----
topic_encoder = LabelEncoder()
X_train["topic"] = topic_encoder.fit_transform(X_train["topic"])
X_test["topic"] = topic_encoder.transform(X_test["topic"])

# ---- Encode target (grade -> int) ----
grade_encoder = LabelEncoder()
y_train = grade_encoder.fit_transform(y_train)
y_test = grade_encoder.transform(y_test)

# ---- Train model ----
model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.9,
    colsample_bytree=0.9,
    random_state=42,
    use_label_encoder=False,   # för att slippa warning i XGB < 1.7
    eval_metric="mlogloss"
)
model.fit(X_train, y_train)

# ---- Quick eval ----
print("Evaluation report:\n")
print(classification_report(y_test, model.predict(X_test), target_names=grade_encoder.classes_))

# ---- Safe save function (Windows-friendly) ----
def safe_dump(obj, path):
    """Save object safely on Windows (atomic write)."""
    fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    os.close(fd)  # stäng direkt så att Windows inte låser filen
    try:
        joblib.dump(obj, tmp_path, compress=3)
        shutil.move(tmp_path, path)
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise

# ---- Save artefacts ----
safe_dump(model, MODEL_DIR / "trained_model.pkl")
safe_dump(topic_encoder, MODEL_DIR / "topic_encoder.pkl")
safe_dump(grade_encoder, MODEL_DIR / "grade_encoder.pkl")
safe_dump(list(X_train.columns), MODEL_DIR / "feature_order.pkl")

# Även i XGBoosts eget JSON-format
model.save_model(MODEL_DIR / "trained_model.json")

print(f"✅ Artefacts saved to: {MODEL_DIR.resolve()}")
