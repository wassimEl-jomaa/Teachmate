🎓 EduMate – AI-Driven Homework Feedback System
EduMate is an intelligent education platform that uses machine learning (ML) and NLP to analyze student homework submissions, predict grades, and generate automated feedback for teachers and students.
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## 🚀 Features

✅ FastAPI Backend
✅ AI Grade Prediction (Random Forest / XGBoost)
✅ AI Feedback Generation (based on teacher dataset)
✅ Student, Teacher, and Admin Role Support
✅ Homework & Submission Management
✅ SQLAlchemy ORM + SQLite/PostgreSQL support
✅ Automatic Scoring Criteria Calculation (steps, reasoning, clarity)

### 🧠 Machine Learning Integration

The project includes an ML model trained on student homework data (klass9_matte_inlamningar_dataset.csv)
to predict grades (A–F) and generate teacher-style comments.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### Model files
Located in /backend/model/:
trained_model.pkl
feature_order.pkl
grade_encoder.pkl
topic_encoder.pkl

### These are automatically loaded on backend startup:

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
model = joblib.load(os.path.join(MODEL_DIR, "trained_model.pkl"))
feature_order = joblib.load(os.path.join(MODEL_DIR, "feature_order.pkl"))
grade_encoder = joblib.load(os.path.join(MODEL_DIR, "grade_encoder.pkl"))
topic_encoder = joblib.load(os.path.join(MODEL_DIR, "topic_encoder.pkl"))


### ⚙️ Tech Stack
| Component               | Technology                           |
| ----------------------- | ------------------------------------ |
| **Backend Framework**   | FastAPI                              |
| **Database**            | SQLite / PostgreSQL (SQLAlchemy ORM) |
| **ML Frameworks**       | scikit-learn, XGBoost, Pandas        |
| **Authentication**      | JWT (JSON Web Token)                 |
| **Environment**         | Python 3.11                          |
| **Frontend (optional)** | React / Next.js (EduMate UI)         |


### Project Structure
EduMate/
│
├── backend/
│   ├── app.py                      # Main FastAPI application
│   ├── db_setup.py                 # Database configuration
│   ├── models.py                   # SQLAlchemy ORM models
│   ├── schemas.py                  # Pydantic schemas
│   ├── crud.py                     # Database operations
│   ├── ml_utils.py                 # Feature extraction & ML helpers
│   ├── ml_service.py               # AI grade/feedback generation
│   ├── model/                      # Saved ML model + encoders
│   ├── data/                       # Training datasets
│   ├── logs/                       # Logs (optional)
│   └── .venv/                      # Virtual environment
│
└── README.md

### Create and activate virtual environment
python -m venv .venv
source .venv/Scripts/activate  # Windows

### Install dependencies

pip install -r requirements.txt  


### Start the FastAPI server
python -m uvicorn app:app --reload
### Open in browser
👉 http://127.0.0.1:8000/docs

Use the interactive Swagger UI to test endpoints.