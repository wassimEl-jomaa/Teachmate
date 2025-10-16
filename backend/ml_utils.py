from datetime import date
import datetime
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func
import re
from collections import Counter
from models import  Scoring_Criteria, User
from fastapi import Depends, HTTPException
from sqlalchemy.orm.exc import NoResultFound
from models import Homework, Homework_Submission, Student_Homework
# --- ML PREDICTION UTILITIES ---
import joblib
import pandas as pd
import numpy as np
import os
def extract_topic_from_description(description: str) -> str:
    """
    Analyzes description and returns the topic (ämne) based on weighted keywords.
    """
    if not description or description.strip() == "":
        return "Unknown"

    # Normalize text
    text = re.sub(r"[^a-zåäö0-9% ]", " ", description.lower())

    # Topics and weighted keywords
    topics = {
    "Algebra": {"algebra": 2, "polynom": 2, "ekvation": 1, "equation": 1,"uttryck":1, "förenkla":1},
    "Geometri": {"geometri": 2, "triangel": 2, "cirkel": 2, "area": 1, "volym": 1},
    "Ekvationer": {"ekvation": 2, "ekvationer": 2, "system of equations": 2, "x": 1, "variables": 1},
    "Procent": {
            "procent": 2, "%": 2, "ränta": 2, "ökning": 1, "minskning": 1,
            "moms": 1, "rabatt": 1, "skatt": 1, "percentage": 2
        },
    "Statistik & Sannolikhet": {"statistik": 2, "sannolikhet": 2, "medelvärde": 1, "varians": 1, "probability": 1},
    "Funktioner": {"funktion": 2, "graf": 2, "linjär": 1, "parabel": 2},
    "Problemlösning": {"problem": 1, "lösning": 1, "strategi": 1, "modellering": 1}
}

    scores = Counter()

    # Count matches
    for topic, keywords in topics.items():
        for word, weight in keywords.items():
            if word in text:
                scores[topic] += weight

    if not scores:
        return "Unknown"

    # Pick the topic with highest score
    best_topic, best_score = scores.most_common(1)[0]
    return best_topic

# New function to calculate difficulty from description

def calculate_difficulty_from_description(description: str) -> int:
    """
    Analyze description and return difficulty_1to5.
    Uses keyword + regex matching.
    Prioritizes very easy if detected, otherwise returns the hardest level found.
    1 = very easy, ..., 5 = very hard.
    """
    if not description or description.strip() == "":
        return 1  
    
    desc = description.lower()
    scores = []

    keyword_weights = {
        # Very easy
        "add": 1, "subtract": 1, "simple": 1, "basic": 1,
        "straightforward": 1, "arithmetic": 1, "2+2": 1,
        "förenkla": 1, "uttryck": 1, "enkel": 1, "plus": 1, "minus": 1,
        "grundläggande": 1, "rakt på sak": 1, "räkna ut": 1,
        "medelvärde": 1, "snitt": 1, "average": 1,
        "enkel ekvation": 1, "simple equation": 1, "1-stegs ekvation": 1,
        "one step equation": 1, "basic equation": 1,

        # Easy
        "slightly": 2, "easy": 2, "steps": 2,
        "procent": 2, "percentage": 2,

        # Medium
        "multi-step": 3, "solve": 3, "equation": 3, "ekvation": 3,
        "linear": 3, "fractions": 3, "factoring": 3, "algebra": 3,
        "flera steg": 3, "linjär": 3, "bråk": 3, "faktorisera": 3, "lös": 3,

        # Hard
        "challenging": 4, "requires reasoning": 4, "geometry": 4,
        "probability": 4, "trigonometry": 4,
        "utmanande": 4, "geometri": 4, "sannolikhet": 4,
        "trigonometri": 4, "kräver resonemang": 4,

        # Very hard
        "complex": 5, "real-world": 5, "modeling": 5,
        "quadratic": 5, "formula": 5, "complex roots": 5,
        "nonlinear": 5, "system of equations": 5,
        "komplex": 5, "modellering": 5, "andragradsekvation": 5,
        "formel": 5, "icke-linjär": 5, "ekvationssystem": 5, "x^2": 5,
    }

     # Keyword-based
    for keyword, weight in keyword_weights.items():
        if keyword in desc:
            scores.append(weight)

    # Regex heuristics
    if re.search(r"\b\d+\s*[\+\-]\s*\d+\b", desc):   # simple arithmetic
        scores.append(1)
    if re.search(r"\d+%\s+av\s+\d+", desc):          # percent of number
        scores.append(1)
    if re.search(r"\b\d*x\s*[\+\-]\s*\d+\s*=\s*\d+\b", desc):  # one-step equation
        scores.append(1)
    if re.search(r"x\^2|x\*\*2|x²", desc):           # quadratic
        scores.append(5)

    # Prioritization
    if scores:
        if 5 in scores:
            return 5
        if 1 in scores:
            return 1
        return max(scores)

    return 3



# New function to get steps count with description    
def calculate_steps_count(submission_text: str) -> int:
    """
    Räknar antalet lösningssteg i en elevlösning.
    - Varje rad räknas som 1 steg (oavsett hur många "=" finns).
    - Sekvensord (först, sedan, slutligen, etc.) kan dela upp en rad i flera steg.
    """
    if not submission_text or not submission_text.strip():
        return 0

    text = submission_text.strip().lower()
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    steps = 0
    for line in lines:
        # Mycket kort rad (t.ex. "x=3") → 1 steg
        if len(line.split()) <= 4:
            steps += 1
            continue

        # Om raden innehåller sekvensord → dela upp i flera steg
        if any(word in line for word in ["först", "sedan", "därefter", "slutligen", "finally", "then"]):
            parts = re.split(r"(först|sedan|därefter|slutligen|finally|then)", line)
            steps += len([p for p in parts if p.strip()])
        else:
            # En hel rad räknas alltid som 1 steg, även om den innehåller flera "="
            steps += 1

    return steps

# New function to estimate expected steps from description
def estimate_expected_steps(topic: str, difficulty: int) -> int:
    """
    Returnerar förväntade steg baserat på ämne (topic) och svårighetsgrad (difficulty).
    Difficulty: 1=Very Easy, 2=Easy, 3=Medium, 4=Hard, 5=Very Hard
    """
    # Basmatris för varje topic och difficulty
    topic_difficulty_map = {
        "Algebra":        {1: 2, 2: 3, 3: 5, 4: 6, 5: 7},
        "Ekvationer":     {1: 2, 2: 3, 3: 4, 4: 5, 5: 6},
        "Procent":        {1: 2, 2: 3, 3: 4, 4: 5, 5: 6},
        "Statistik & Sannolikhet": {1: 2, 2: 3, 3: 4, 4: 6, 5: 7},
        "Funktioner":     {1: 2, 2: 3, 3: 4, 4: 6, 5: 7},
        "Geometri":       {1: 3, 2: 4, 3: 5, 4: 6, 5: 8},
        "Problemlösning": {1: 3, 2: 4, 3: 5, 4: 7, 5: 8},
    }

    # Om ämnet finns i matrisen, använd den
    if topic in topic_difficulty_map:
        return topic_difficulty_map[topic].get(difficulty, 4)

    # Fallback = medium (4 steg)
    return 4
def calculate_steps_completeness(session: Session):
    results = []
    query = (
        session.query(
            Homework.id,
            Homework.description,
            Homework.topic,
            Homework.difficulty_1to5,
            Homework_Submission.submission_text
        )
        .join(Homework_Submission, Homework.id == Homework_Submission.homework_id)
        .all()
    )

    for result in query:
        actual_steps = calculate_steps_count(result.submission_text)
        expected_steps = estimate_expected_steps(result.topic, result.difficulty_1to5)
        completeness = round(min(actual_steps / expected_steps, 1.0), 2)

        results.append({
            "homework_id": result.id,
            "description": result.description,
            "topic": result.topic,
            "difficulty": result.difficulty_1to5,
            "expected_steps": expected_steps,
            "actual_steps": actual_steps,
            "steps_completeness": completeness
        })

    return results
def calculate_reasoning_quality(submission_text: str) -> float:
    """
    Analyserar en elevs lösning och skattar reasoning_quality (0–1).
    Bedömningskriterier:
      - Närvaro av matematiska operationer (=, +, -, *, /)
      - Kopplingar mellan steg (ex: "därför", "alltså", "sedan", "således")
      - Förklarande ord (ex: "eftersom", "vi flyttar", "dividera med", "addera")
      - Antal steg (>1 steg = bättre resonemang)
    Returnerar ett värde mellan 0.0 (svagt resonemang) och 1.0 (starkt resonemang).
    """

    if not submission_text or not submission_text.strip():
        return 0.0  # tom inlämning = inget resonemang

    text = submission_text.lower()
    steps = [line.strip() for line in text.split("\n") if line.strip()]

    # --- Heuristiska indikatorer ---
    has_math_ops = any(op in text for op in ["=", "+", "-", "*", "/", "^"])
    has_links = any(word in text for word in ["därför", "alltså", "sedan", "således", "därav", "therefore", "because"])
    has_explanations = any(word in text for word in ["eftersom", "flyttar", "dividera", "addera", "förenkla", "löser"])
    step_count = len(steps)

    # --- Poängsystem ---
    score = 0

    if has_math_ops:
        score += 0.3
    if has_links:
        score += 0.3
    if has_explanations:
        score += 0.3
    if step_count > 1:
        score += 0.1  # lite bonus för flera steg

    # Clamp mellan 0.0 och 1.0
    return round(min(score, 1.0), 2)

def calculate_method_appropriateness(submission_text: str, homework_description: str) -> float:
    if not submission_text or not submission_text.strip():
        return 0.0

    desc = homework_description.lower()
    sub = submission_text.lower()

    # Ekvationer
    if any(word in desc for word in ["equation", "ekvation", "solve", "lös"]):
        if any(word in sub for word in ["algebra", "x =", "factor", "faktorisera", "formel", "pq"]):
            return 1.0
        elif any(word in sub for word in ["guess", "trial", "prova", "gissa"]):
            return 0.5
        else:
            return 0.3

    # Procent
    if any(word in desc for word in ["procent", "%", "percentage", "increase", "decrease"]):
        if "%" in sub or "procent" in sub:
            return 1.0
        else:
            return 0.0  # wrong method

    # Geometri
    if any(word in desc for word in ["geometri", "pythagoras", "area", "volym", "circle", "triangel"]):
        if "pythagoras" in sub or "area" in sub or "volym" in sub:
            return 1.0
        else:
            return 0.3

    # Statistik & Sannolikhet
    if any(word in desc for word in ["statistik", "sannolikhet", "probability", "mean", "average", "medelvärde", "snitt"]):
        if "medelvärde" in sub or "snitt" in sub or "/ 3" in sub or "average" in sub:
            return 1.0
        else:
            return 0.3

    # General fallbacks
    if "guess" in sub or "trial" in sub:
        return 0.5
    if "pythagoras" in sub and "procent" in desc:
        return 0.0

    return 0.5

# New function to calculate representation_use
def calculate_representation_use(submission_text: str) -> float:
    """
    Analyserar submission_text och beräknar representation_use baserat på fördefinierade kriterier.
    """
    if not submission_text or submission_text.strip() == "":
        # Ingen text = inga representationer
        return 0.0

    # Kontrollera om texten innehåller representationer
    has_diagram = "diagram" in submission_text.lower()
    has_graph = "graph" in submission_text.lower()
    has_table = "table" in submission_text.lower()

    # Kontrollera om representationerna är effektiva
    if has_diagram or has_graph or has_table:
        if "incorrect" in submission_text.lower() or "unclear" in submission_text.lower():
            # Representationer finns men är missvisande
            return 0.5
        else:
            # Representationer är tydliga och effektiva
            return 1.0

    # Om inga representationer finns
    return 0.0

# New function to calculate explanation_clarity
def calculate_explanation_clarity(submission_text: str) -> float:
    """
    Analyserar submission_text och beräknar explanation_clarity baserat på fördefinierade kriterier.
    """
    if not submission_text or submission_text.strip() == "":
        # Ingen text = otydlig förklaring
        return 0.0

    # Kontrollera om texten innehåller kompletta meningar
    has_complete_sentences = "." in submission_text or "?" in submission_text or "!" in submission_text

    # Kontrollera om texten använder matematiskt språk
    uses_math_language = any(
        keyword in submission_text.lower()
        for keyword in ["add", "subtract", "divide", "multiply", "isolate", "solve", "equation"]
    )

    # Kontrollera om texten är steg-för-steg
    is_step_by_step = submission_text.count("\n") > 1

    # Bedömning baserat på kriterier
    if has_complete_sentences and uses_math_language and is_step_by_step:
        return 1.0  # Mycket tydlig förklaring
    elif has_complete_sentences or uses_math_language:
        return 0.5  # Delvis tydlig förklaring
    else:
        return 0.0  # Otydlig förklaring 
 # New function to calculate units_handling   
def calculate_units_handling(submission_text: str) -> float:
    """
    Analyserar submission_text och beräknar units_handling baserat på fördefinierade kriterier.
    """
    if not submission_text or submission_text.strip() == "":
        # Ingen text = dålig hantering av enheter
        return 0.0

    # Kontrollera om texten innehåller enheter
    has_units = any(
        unit in submission_text.lower()
        for unit in ["cm", "m", "km", "mm", "kg", "g", "l", "ml", "s", "min", "h"]
    )

    # Kontrollera om texten innehåller korrekta konverteringar
    has_conversions = any(
        conversion in submission_text.lower()
        for conversion in ["=", "convert", "to", "from"]
    )

    # Kontrollera om texten innehåller felaktiga enheter
    has_errors = any(
        error in submission_text.lower()
        for error in ["mixed units", "wrong units", "missing units"]
    )

    # Bedömning baserat på kriterier
    if has_units and has_conversions and not has_errors:
        return 1.0  # Korrekt hantering av enheter
    elif has_units and (not has_conversions or has_errors):
        return 0.5  # Delvis korrekt hantering av enheter
    else:
        return 0.0  # Dålig hantering av enheter   
# New function to calculate language_quality
def calculate_language_quality(submission_text: str) -> float:
    """
    Analyserar submission_text och beräknar language_quality baserat på fördefinierade kriterier.
    """
    if not submission_text or submission_text.strip() == "":
        # Ingen text = mycket dåligt språk
        return 0.0

    # Kontrollera om texten innehåller grammatiska eller stavfel (enkel kontroll)
    has_grammar_issues = any(
        issue in submission_text.lower()
        for issue in ["stuff", "thing", "did", "got", "move"]
    )

    # Kontrollera om texten använder matematiska termer
    uses_math_terms = any(
        term in submission_text.lower()
        for term in ["factor", "variable", "simplify", "probability", "equation", "subtract", "add", "divide", "multiply"]
    )

    # Kontrollera om texten är logiskt strukturerad
    is_logically_structured = "." in submission_text or "\n" in submission_text

    # Bedömning baserat på kriterier
    if uses_math_terms and is_logically_structured and not has_grammar_issues:
        return 1.0  # Mycket tydligt och precist språk
    elif uses_math_terms or is_logically_structured:
        return 0.5  # Genomsnittligt språk
    else:
        return 0.0  # Mycket dåligt språk     

# New function to calculate computational_errors

def calculate_computational_errors(submission_text: str) -> int:
    """
    Analyserar submission_text och beräknar antalet computational_errors baserat på fördefinierade kriterier.
    """
    if not submission_text or not submission_text.strip():
        return 0

    # Regex för att hitta enkla aritmetiska uttryck (t.ex. "7 * 8 = 54")
    calculations = re.findall(r"(\d+)\s*([\+\-\*/])\s*(\d+)\s*=\s*(\d+)", submission_text)

    errors = 0

    for num1, operator, num2, result in calculations:
        num1, num2, result = int(num1), int(num2), int(result)

        if operator == "+":
            correct_result = num1 + num2
        elif operator == "-":
            correct_result = num1 - num2
        elif operator == "*":
            correct_result = num1 * num2
        elif operator == "/":
            correct_result = num1 / num2
        else:
            continue

        if correct_result != result:
            errors += 1

    return errors
# New function to calculate conceptual_errors
def calculate_conceptual_errors(submission_text: str) -> int:
    """
    Analyserar submission_text och beräknar antalet conceptual_errors baserat på fördefinierade kriterier.
    """
    if not submission_text or submission_text.strip() == "":
        # Ingen text = inga konceptuella fel att analysera
        return 0

    # Lista över vanliga konceptuella fel
    conceptual_error_indicators = [
        "wrong formula", "incorrect theorem", "misunderstood definition",
        "used Pythagoras incorrectly", "wrong method", "misapplied rule"
    ]

    # Kontrollera om texten innehåller konceptuella fel
    errors = sum(1 for indicator in conceptual_error_indicators if indicator in submission_text.lower())

    # Returnera antalet konceptuella fel
    return errors
# New function to calculate correctness_pct
def calculate_correctness_pct(submission_text: str, expected_answer: str) -> int:
    """
    Analyserar submission_text och beräknar correctness_pct baserat på fördefinierade kriterier.
    """
    if not submission_text or submission_text.strip() == "":
        # Ingen text = helt fel
        return 0

    # Kontrollera om det slutliga svaret är korrekt
    is_final_answer_correct = expected_answer in submission_text

    # Kontrollera om stegen innehåller korrekta operationer
    has_correct_steps = any(
        keyword in submission_text.lower()
        for keyword in ["add", "subtract", "divide", "multiply", "simplify", "solve"]
    )

    # Bedömning baserat på kriterier
    if is_final_answer_correct and has_correct_steps:
        return 100  # Fullt korrekt
    elif is_final_answer_correct or has_correct_steps:
        return 50  # Delvis korrekt
    else:
        return 0  # Helt fel
# New function to calculate time_minutes
def calculate_time_minutes(start_time: datetime, end_time: datetime) -> int:
    """
    Beräknar tidsåtgången i minuter baserat på start- och sluttid.
    """
    if not start_time or not end_time:
        # Om tidsdata saknas, returnera 0
        return 0

    # Beräkna skillnaden i minuter
    time_difference = (end_time - start_time).total_seconds() / 60
    return int(time_difference)    
# function to calculate external_aid_suspected
def calculate_external_aid_suspected(submission_text: str, student_history: dict = None) -> float:
    """
    Analyserar submission_text och beräknar external_aid_suspected baserat på fördefinierade kriterier.
    """
    if not submission_text or submission_text.strip() == "":
        # Ingen text = ingen misstanke
        return 0.0

    # Kontrollera om texten är perfekt och polerad
    is_perfect_solution = "no mistakes" in submission_text.lower() or "perfect" in submission_text.lower()

    # Kontrollera om texten saknar resonemang
    missing_reasoning = not any(
        keyword in submission_text.lower()
        for keyword in ["because", "therefore", "reason", "explanation"]
    )

    # Kontrollera om texten använder avancerat språk
    uses_advanced_language = any(
        keyword in submission_text.lower()
        for keyword in ["complex", "advanced", "sophisticated", "optimal"]
    )

    # Jämför med studentens tidigare arbete (om tillgängligt)
    if student_history:
        unusual_style = submission_text not in student_history.get("previous_submissions", [])
    else:
        unusual_style = False

    # Bedömning baserat på kriterier
    if is_perfect_solution and missing_reasoning and (uses_advanced_language or unusual_style):
        return 1.0  # Stark misstanke
    elif is_perfect_solution or missing_reasoning or unusual_style:
        return 0.5  # Viss misstanke
    else:
        return 0.0  # Ingen misstanke
#  function to calculate rubric_points_v2
def calculate_rubric_points_v2(
    method_appropriateness: float,
    computational_errors: int,
    explanation_clarity: float,
    units_handling: float
) -> int:
    """
    Beräknar rubric_points baserat på en rubric med kategorier:
    - Correct Method (3 pts)
    - Correct Calculations (3 pts)
    - Clear Explanation (2 pts)
    - Units/Representation (2 pts)
    """
    # Correct Method (3 pts)
    if method_appropriateness == 1.0:
        method_points = 3
    elif method_appropriateness == 0.5:
        method_points = 1
    else:
        method_points = 0

    # Correct Calculations (3 pts)
    if computational_errors == 0:
        calculation_points = 3
    elif computational_errors == 1:
        calculation_points = 1
    else:
        calculation_points = 0

    # Clear Explanation (2 pts)
    if explanation_clarity == 1.0:
        explanation_points = 2
    elif explanation_clarity == 0.5:
        explanation_points = 1
    else:
        explanation_points = 0

    # Units/Representation (2 pts)
    if units_handling == 1.0:
        units_points = 2
    elif units_handling == 0.5:
        units_points = 1
    else:
        units_points = 0

    # Summera poängen
    total_points = method_points + calculation_points + explanation_points + units_points

    # Konvertera till en procentandel (max 10 poäng = 100%)
    rubric_points = int((total_points / 10) * 100)

    return rubric_points    

# Model directory (adjust if needed)
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

# Load pre-trained model and encoders
try:
    model = joblib.load(os.path.join(MODEL_DIR, "trained_model.pkl"))
    topic_encoder = joblib.load(os.path.join(MODEL_DIR, "topic_encoder.pkl"))
    grade_encoder = joblib.load(os.path.join(MODEL_DIR, "grade_encoder.pkl"))
    feature_order = joblib.load(os.path.join(MODEL_DIR, "feature_order.pkl"))
    print("✅ ML model and encoders loaded successfully.")
except Exception as e:
    print(f"⚠️ Warning: Could not load model or encoders: {e}")


def predict_grade(model, feature_order, grade_encoder, topic_encoder, scoring):
    """
    Predicts a grade based on scoring_criteria values.

    Args:
        model: Trained ML model (e.g. RandomForestClassifier)
        feature_order: List of feature names used during training
        grade_encoder: LabelEncoder for grades (A–F)
        topic_encoder: LabelEncoder for topics
        scoring: dict with feature values (topic, difficulty_1to5, etc.)

    Returns:
        str: Predicted grade (A–F)
    """
    try:
        # --- 1️⃣ Ensure all expected features exist ---
        scoring = {f: scoring.get(f, 0) for f in feature_order}

        # --- 2️⃣ Encode topic safely ---
        if isinstance(scoring["topic"], str):
            if scoring["topic"] in topic_encoder.classes_:
                scoring["topic"] = int(topic_encoder.transform([scoring["topic"]])[0])
            else:
                scoring["topic"] = -1  # Unknown topic → safe fallback

        # --- 3️⃣ Build DataFrame with proper order ---
        X = pd.DataFrame([scoring])[feature_order]

        # --- 4️⃣ Convert all columns to numeric (safe cast) ---
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors="coerce").fillna(0)

        # --- 5️⃣ Ensure the model input matches training shape ---
        X = X.astype(float)

        # --- 6️⃣ Predict grade ---
        y_pred = model.predict(X)
        grade = grade_encoder.inverse_transform(y_pred)[0]

        return grade

    except Exception as e:
        print(f"❌ [predict_grade] Error: {e}")
        return "N/A"  # return fallback if prediction fails


def generate_teacher_feedback(feedback_model, feedback_vectorizer, teacher_comments, new_text):
    """
    Find the most similar teacher comment from training data given a new text.
    Returns: The most relevant feedback (string)
    """
    if feedback_model is None or feedback_vectorizer is None:
        return "Ingen feedbackmodell tillgänglig."

    # Transform new student text
    X_new = feedback_vectorizer.transform([new_text])

    # Find nearest neighbor (most similar existing feedback)
    distance, index = feedback_model.kneighbors(X_new)
    feedback = teacher_comments.iloc[index[0][0]]

    # If similarity is poor (>0.6 cosine distance), give a generic fallback
    if distance[0][0] > 0.6:
        return "Bra försök! Försök förklara varje steg tydligare och kontrollera beräkningarna noga."
    return feedback