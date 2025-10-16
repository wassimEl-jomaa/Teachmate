from pathlib import Path
import joblib
import pandas as pd
from xgboost import XGBClassifier
from typing import Dict, Any
import re
import time
import json
from typing import Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass
from decimal import Decimal
import numpy as np

@dataclass
class ScorePrediction:
    score: Optional[float]
    band: Optional[str]
    confidence: float
    reason: str
    processing_time_ms: float
    analysis_data: Dict[str, Any]
    model_used: str = "EduMate_Scorer_v1"

# Paths
MODEL_DIR = Path(__file__).resolve().parent / "model"

# Globals (start empty, load on startup)
_model = None
_topic_encoder = None
_feature_order = None


def init_models():
    """Load all ML artefacts safely"""
    global _model, _topic_encoder, _feature_order

    try:
        m = XGBClassifier()
        m.load_model(MODEL_DIR / "trained_model.json")
        _model = m
        print("✅ Model loaded")
    except Exception as e:
        print(f"❌ Could not load model: {e}")

    try:
        _topic_encoder = joblib.load(MODEL_DIR / "topic_encoder.pkl")
        print("✅ Topic encoder loaded")
    except Exception as e:
        print(f"❌ Could not load topic_encoder.pkl: {e}")

    try:
        _feature_order = joblib.load(MODEL_DIR / "feature_order.pkl")
        print("✅ Feature order loaded")
    except Exception as e:
        print(f"❌ Could not load feature_order.pkl: {e}")


def get_model():
    if _model is None:
        raise RuntimeError("Model not loaded – did you call init_models()?")
    return _model


def get_topic_encoder():
    if _topic_encoder is None:
        raise RuntimeError("Topic encoder not loaded – did you call init_models()?")
    return _topic_encoder


def get_feature_order():
    if _feature_order is None:
        raise RuntimeError("Feature order not loaded – did you call init_models()?")
    return _feature_order

class InferenceService:
    def _preprocess(self, payload: Dict[str, Any]) -> pd.DataFrame:
        df = pd.DataFrame([payload])
        # Encode 'topic'
        df["topic"] = _topic_encoder.transform(df["topic"])
        # Ordna kolumner exakt som vid träning
        df = df[_feature_order]
        return df

    def predict(self, payload: Dict[str, Any]):
        df = self._preprocess(payload)
        pred = _model.predict(df)[0]
        proba = _model.predict_proba(df)[0]
        classes = list(_model.classes_)
        probs = {cls: float(p) for cls, p in zip(classes, proba)}
        return pred, probs

class FeedbackService:
    """
    Minimal AI-feedback: returnerar motiveringar baserat på features.
    Bygg vidare med egna regler/LLM om du vill.
    """
    def generate(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Exempel: enkel regelbaserad feedback
        reasons = []
        if payload.get("conceptual_errors", 0) > 0:
            reasons.append("Minska konceptuella fel genom att repetera nyckelbegrepp.")
        if payload.get("computational_errors", 0) > 1:
            reasons.append("Dubbelkolla beräkningar och räknesätt.")
        if payload.get("steps_completeness", 1.0) < 0.6:
            reasons.append("Gör redovisningen mer komplett med tydliga mellanled.")
        if payload.get("reasoning_quality", 1.0) < 0.6:
            reasons.append("Motivera stegen tydligare och koppla till regler/satser.")
        if payload.get("units_handling", 1.0) < 0.6:
            reasons.append("Säkerställ korrekta enheter i varje steg.")
        if not reasons:
            reasons.append("Bra jobbat! Fortsätt på samma sätt med tydliga resonemang.")

        return {
            "summary": "Automatisk återkoppling för att förbättra lösningen.",
            "suggestions": reasons
        }

feedback_service = FeedbackService()
class ScoringService:
    """AI-powered homework scoring service using existing AI models"""
    
    def __init__(self):
        self.min_length = 50
        self.model_name = "EduMate_Scorer_v1"
        self.grade_bands = {
            'A': (90, 100), 'B': (80, 89), 'C': (70, 79),
            'D': (60, 69), 'E': (50, 59), 'F': (0, 49)
        }
    
    def score_submission(self, submission_text: str, subject: str = "mathematics") -> ScorePrediction:
        """Score a homework submission using AI analysis"""
        start_time = time.time()
        
        try:
            # Check minimum length requirement
            if len(submission_text.strip()) < self.min_length:
                return ScorePrediction(
                    score=None, band=None, confidence=0.0,
                    reason=f"Submission too short (minimum {self.min_length} characters required)",
                    processing_time_ms=(time.time() - start_time) * 1000,
                    analysis_data={"error": "insufficient_length", "length": len(submission_text)},
                    model_used=self.model_name
                )
            
            # Analyze submission components
            analysis_results = self._perform_analysis(submission_text, subject)
            
            # Calculate final score
            final_score = self._calculate_final_score(analysis_results)
            band = self._score_to_band(final_score)
            confidence = self._calculate_confidence(analysis_results, final_score)
            
            # Generate explanation
            reason = self._generate_explanation(analysis_results)
            
            return ScorePrediction(
                score=round(final_score, 1),
                band=band,
                confidence=round(confidence, 2),
                reason=reason,
                processing_time_ms=(time.time() - start_time) * 1000,
                analysis_data=analysis_results,
                model_used=self.model_name
            )
            
        except Exception as e:
            return ScorePrediction(
                score=None, band=None, confidence=0.0,
                reason=f"Scoring error: {str(e)}",
                processing_time_ms=(time.time() - start_time) * 1000,
                analysis_data={"error": str(e)},
                model_used=self.model_name
            )
    
    def _perform_analysis(self, text: str, subject: str) -> Dict[str, Any]:
        """Perform comprehensive analysis of submission"""
        return {
            "length": len(text),
            "word_count": len(text.split()),
            "content_quality": self._analyze_content_quality(text),
            "mathematical_rigor": self._analyze_mathematical_content(text),
            "structure_organization": self._analyze_structure(text),
            "language_clarity": self._analyze_language(text),
            "subject_relevance": self._analyze_subject_relevance(text, subject),
            "completeness": self._analyze_completeness(text)
        }
    
    def _analyze_content_quality(self, text: str) -> float:
        """Analyze overall content quality"""
        score = 0.2  # Base score
        
        # Length appropriateness (0.4 weight)
        length = len(text)
        if 400 <= length <= 2000:  # Raised threshold for excellent
            score += 0.4
        elif 200 <= length < 400 or 2000 < length <= 3000:
            score += 0.3
        elif 100 <= length < 200:
            score += 0.2
        elif length > 50:
            score += 0.1
        
        # Depth indicators (0.4 weight)
        depth_indicators = [
            r'(därför|therefore|således|hence|consequently)',
            r'(eftersom|because|due to|på grund av)',
            r'(exempelvis|till exempel|for example|such as)',
            r'(kontroll|verification|check|verifi)',
            r'(analys|analysis|undersök|investigate)',
            r'(steg|step)',
            r'(lösning|solution)',
            r'(given|givet)',
            r'(slutsats|conclusion)',
            r'(identifiera|identify)',
        ]
        
        found_indicators = sum(1 for pattern in depth_indicators if re.search(pattern, text, re.IGNORECASE))
        score += min(0.4, found_indicators * 0.05)  # Reduced multiplier
        
        # Coherence (0.3 weight)
        sentences = re.split(r'[.!?]+', text)
        if len(sentences) > 5:  # Higher threshold
            avg_sentence_length = sum(len(s.split()) for s in sentences if s.strip()) / len(sentences)
            if 8 <= avg_sentence_length <= 25:
                score += 0.3
            elif 5 <= avg_sentence_length < 8 or 25 < avg_sentence_length <= 35:
                score += 0.2
            else:
                score += 0.1
        elif len(sentences) > 2:
            score += 0.15
        
        return min(1.0, score)
    
    def _analyze_mathematical_content(self, text: str) -> float:
        """Analyze mathematical content and notation"""
        score = 0.1  # Lower base score
        
        # Mathematical symbols (0.4 weight)
        math_symbols = [
            r'[=≠<>≤≥≈]',
            r'[+\-×÷*/^]',
            r'∫|∑|∏|√|∆|∂',
            r'[αβγδεθλμπσφψω]',
            r'sin|cos|tan|log|ln|exp|lim',
            r'\d+[\.,]\d+',
            r'x\^?\d+|x²|x³|y²|y³',
            r'\d+',
            r'[xyz]',
            r'→|⇒',
        ]
        
        found_symbols = sum(1 for pattern in math_symbols if re.search(pattern, text, re.IGNORECASE))
        score += min(0.4, found_symbols * 0.02)  # Reduced multiplier
        
        # Mathematical structure (0.4 weight)
        structure_patterns = [
            r'(lösning|solution|svar|answer)',
            r'(bevis|proof|visa|show)',
            r'(given|givet|antag|assume)',
            r'(därför|therefore|thus|så)',
            r'(steg \d+|step \d+|\d+\))',
            r'(ekvation|equation)',
            r'(faktor|factor)',
            r'(andragrad|quadratic)',
            r'(standardform|standard form)',
            r'(nollprodukt|zero product)',
        ]
        
        found_structures = sum(1 for pattern in structure_patterns if re.search(pattern, text, re.IGNORECASE))
        score += min(0.4, found_structures * 0.04)  # Reduced multiplier
        
        # Problem-solving approach (0.2 weight)
        if re.search(r'(kontroll|check|verifi)', text, re.IGNORECASE):
            score += 0.08
        if re.search(r'(substitution|insättning|ersätt)', text, re.IGNORECASE):
            score += 0.04
        if re.search(r'(multipliceras|adderas|×|\+)', text, re.IGNORECASE):
            score += 0.04
        if re.search(r'(nollprodukt|zero product)', text, re.IGNORECASE):
            score += 0.04
        
        return min(1.0, score)
    
    def _analyze_structure(self, text: str) -> float:
        """Analyze submission structure and organization"""
        score = 0.1  # Lower base score
        
        # Clear numbered steps (0.3 weight)
        step_count = len(re.findall(r'(steg \d+|step \d+)', text, re.IGNORECASE))
        if step_count >= 4:
            score += 0.3
        elif step_count >= 2:
            score += 0.2
        elif step_count >= 1:
            score += 0.1
        
        # Clear sections (0.2 weight)
        if re.search(r'(a\)|b\)|c\)|d\))', text):
            score += 0.1
        if re.search(r'(1\.|2\.|3\.|4\.)', text):
            score += 0.1
        
        # Mathematical steps shown (0.3 weight)
        equation_count = len(re.findall(r'=', text))
        if equation_count >= 5:
            score += 0.3
        elif equation_count >= 3:
            score += 0.2
        elif equation_count >= 1:
            score += 0.1
        
        # Paragraph structure (0.2 weight)
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        if len(paragraphs) >= 4:
            score += 0.2
        elif len(paragraphs) >= 2:
            score += 0.1
        
        return min(1.0, score)
    
    def _analyze_language(self, text: str) -> float:
        """Analyze language clarity and correctness"""
        score = 0.5  # Base score
        
        # Spelling and grammar indicators
        if len(re.findall(r'\b\w+\b', text)) > 20:  # Sufficient content
            score += 0.2
        
        # Proper punctuation
        if re.search(r'[.!?]', text):
            score += 0.15
        
        # Technical vocabulary
        tech_terms = r'(ekvation|funktion|derivata|integral|gränsvärde|asymptot|koefficient)'
        if re.search(tech_terms, text, re.IGNORECASE):
            score += 0.15
        
        # Avoid excessive informal language
        informal_count = len(re.findall(r'\b(typ|liksom|asså|kanske)\b', text, re.IGNORECASE))
        if informal_count == 0:
            score += 0.1
        elif informal_count > 3:
            score -= 0.1
        
        return min(1.0, max(0.0, score))
    
    def _analyze_subject_relevance(self, text: str, subject: str) -> float:
        """Analyze relevance to subject matter"""
        if subject.lower() == "mathematics":
            math_topics = [
                r'(algebra|geometri|trigonometri|kalkyl|statistik)',
                r'(ekvation|funktion|graf|koordinat)',
                r'(sannolikhet|frekvens|medelvärde)',
                r'(derivata|integral|gränsvärde)',
                r'(vektor|matris|determinant)',
                r'(andragrad|kvadrat|faktor)',  # Added for quadratic equations
                r'(\d+.*[×\*].*\d+|\d+.*\+.*\d+)',  # Mathematical operations
                r'(lösning|solution|svar)',  # Solution indicators
                r'(multipliceras|adderas)',  # Mathematical terminology
            ]
            
            found_topics = sum(1 for pattern in math_topics if re.search(pattern, text, re.IGNORECASE))
            base_score = 0.5  # Higher base score
            return min(1.0, base_score + found_topics * 0.15)  # More generous
        
        return 0.5  # Default for unknown subjects
    
    def _analyze_completeness(self, text: str) -> float:
        """Analyze if submission appears complete"""
        score = 0.0
        
        # Has conclusion or final answer
        if re.search(r'(svar|answer|slutsats|conclusion|resultat|result):', text, re.IGNORECASE):
            score += 0.4
        
        # Shows work/process
        if re.search(r'(=|→|⇒|därför|så)', text):
            score += 0.3
        
        # Reasonable length for completeness
        if len(text) > 200:
            score += 0.3
        
        return min(1.0, score)
    
    def _calculate_final_score(self, analysis: Dict[str, Any]) -> float:
        """Calculate weighted final score with educational bonuses"""
        weights = {
            "content_quality": 0.25,
            "mathematical_rigor": 0.30,
            "structure_organization": 0.20,
            "language_clarity": 0.10,
            "subject_relevance": 0.10,
            "completeness": 0.05
        }
        
        final_score = sum(analysis[key] * weights[key] for key in weights if key in analysis)
        
        # More generous bonus system for educational purposes
        if final_score > 0.7:  # Excellent work
            final_score += 0.15  # 15-point bonus
        elif final_score > 0.5:  # Good work
            final_score += 0.12  # 12-point bonus
        elif final_score > 0.35:  # Basic effort
            final_score += 0.15  # 15-point bonus
        elif final_score > 0.25:  # Minimal effort (lowered threshold)
            final_score += 0.15  # Increased bonus for minimal work
        elif final_score > 0.15:  # Very minimal effort
            final_score += 0.10  # Some bonus for any effort
        
        # Special bonus for comprehensive work
        if (analysis.get("completeness", 0) >= 0.8 and 
            analysis.get("structure_organization", 0) >= 0.8 and
            analysis.get("mathematical_rigor", 0) >= 0.8):
            final_score += 0.05  # Comprehensive excellence bonus
        
        # Educational bonus for showing mathematical work
        if analysis.get("mathematical_rigor", 0) >= 0.3:
            final_score += 0.05  # Mathematical effort bonus
        
        # Additional bonus for showing any equations or work
        if analysis.get("mathematical_rigor", 0) >= 0.2:
            final_score += 0.05  # Basic math work bonus
        
        return min(1.0, final_score) * 100
    
    def _calculate_confidence(self, analysis: Dict[str, Any], score: float) -> float:
        """Calculate confidence in prediction"""
        confidence = 0.5  # Base confidence
        
        # Higher confidence for longer submissions
        length_factor = min(1.0, analysis["length"] / 1000)
        confidence += length_factor * 0.2
        
        # Higher confidence for mathematical content
        confidence += analysis["mathematical_rigor"] * 0.2
        
        # Lower confidence for extreme scores
        if score < 20 or score > 95:
            confidence *= 0.8
        
        # Higher confidence for structured submissions
        confidence += analysis["structure_organization"] * 0.1
        
        return min(1.0, confidence)
    
    def _generate_explanation(self, analysis: Dict[str, Any]) -> str:
        """Generate human-readable explanation with stricter thresholds"""
        components = []
        
        # Stricter thresholds for quality assessment
        if analysis["content_quality"] >= 0.9:
            components.append("exceptional content quality")
        elif analysis["content_quality"] >= 0.7:
            components.append("excellent content quality")
        elif analysis["content_quality"] >= 0.5:
            components.append("good content quality")
        elif analysis["content_quality"] >= 0.3:
            components.append("adequate content quality")
        else:
            components.append("basic content quality")
        
        if analysis["mathematical_rigor"] >= 0.9:
            components.append("exceptional mathematical rigor")
        elif analysis["mathematical_rigor"] >= 0.7:
            components.append("strong mathematical rigor")
        elif analysis["mathematical_rigor"] >= 0.5:
            components.append("good mathematical content")
        elif analysis["mathematical_rigor"] >= 0.3:
            components.append("adequate mathematical content")
        else:
            components.append("limited mathematical content")
        
        if analysis["structure_organization"] >= 0.9:
            components.append("exceptional organization")
        elif analysis["structure_organization"] >= 0.7:
            components.append("excellent organization")
        elif analysis["structure_organization"] >= 0.5:
            components.append("well-organized structure")
        elif analysis["structure_organization"] >= 0.3:
            components.append("decent organization")
        else:
            components.append("needs better organization")
        
        if analysis["completeness"] >= 0.8:
            components.append("comprehensive solution")
        elif analysis["completeness"] >= 0.6:
            components.append("complete work shown")
        
        return f"Score based on {', '.join(components)}"
    
    def _score_to_band(self, score: float) -> str:
        """Convert numeric score to letter grade - Fixed mapping"""
        if score is None:
            return None
        
        # Fixed grade bands
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        elif score >= 50:
            return 'E'
        else:
            return 'F'
feedback_templates = {
    "A": "Excellent work! Your solution is well-structured and demonstrates a deep understanding. Keep up the great work!",
    "B": "Good job! Your solution is clear and mostly complete. Focus on refining details for an even better result.",
    "C": "Your solution is acceptable but could use more detail and clarity. Review the key concepts and try to elaborate further.",
    "D": "Your solution shows some understanding but lacks depth and structure. Consider revisiting the topic and practicing similar problems.",
    "E": "Your solution is incomplete and misses key elements. Focus on understanding the basics and building a stronger foundation.",
    "F": "Your solution does not meet the requirements. Start by reviewing the fundamental concepts and seek help if needed."
}

recommended_resources = {
    "mathematics": {
        "A": [
            {"title": "Advanced Algebra", "link": "https://www.khanacademy.org/math/algebra"},
            {"title": "Challenging Math Problems", "link": "https://brilliant.org/"}
        ],
        "B": [
            {"title": "Intermediate Algebra", "link": "https://www.khanacademy.org/math/algebra"},
            {"title": "Practice Problems", "link": "https://www.ixl.com/math/"}
        ],
        # ... other grade bands ...
    },
    "science": {
        "A": [
            {"title": "Advanced Biology Topics", "link": "https://www.khanacademy.org/science/biology"},
            {"title": "Scientific Research", "link": "https://www.nature.com/"}
        ],
        # ... other grade bands ...
    }
}

class FeedbackService:
    """Service for generating feedback and recommended resources."""

    @staticmethod
    def generate_feedback(predicted_band: str, subject: str):
        """Generate feedback and recommended resources based on grade band and subject."""
        if predicted_band not in feedback_templates:
            raise ValueError("Invalid grade band")

        if subject not in recommended_resources:
            raise ValueError("Invalid subject")

        feedback_text = feedback_templates[predicted_band]
        resources = recommended_resources[subject].get(predicted_band, [])

        return {
            "feedback_text": feedback_text,
            "resources": resources
        }
# Global instance
inference_service = InferenceService()
feedback_service = FeedbackService()
scoring_service = ScoringService()