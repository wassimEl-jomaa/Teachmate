import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml_service import scoring_service

def test_comprehensive_scoring():
    """Test with different quality levels"""
    
    test_cases = [
        {
            "name": "Excellent A-Level Solution",
            "text": """
            Lösning av andragradsekvation med faktorisering
            
            Given: x² + 5x + 6 = 0
            
            Steg 1: Identifiera ekvationstyp
            Detta är en andragradsekvation på standardform ax² + bx + c = 0
            där a = 1, b = 5, c = 6
            
            Steg 2: Hitta faktorer för faktorisering
            Jag behöver hitta två tal som:
            - Multipliceras till 6 (konstanttermen c)
            - Adderas till 5 (koefficienten för x, dvs b)
            
            Steg 3: Identifiera faktorerna
            3 × 2 = 6 och 3 + 2 = 5 ✓
            
            Steg 4: Faktorisering
            x² + 5x + 6 = (x + 3)(x + 2) = 0
            
            Steg 5: Tillämpa nollproduktregeln
            För att produkten ska vara noll måste minst en faktor vara noll:
            x + 3 = 0  →  x = -3
            x + 2 = 0  →  x = -2
            
            Steg 6: Kontroll av lösningarna
            För x = -3: (-3)² + 5(-3) + 6 = 9 - 15 + 6 = 0 ✓
            För x = -2: (-2)² + 5(-2) + 6 = 4 - 10 + 6 = 0 ✓
            
            Slutsats: Ekvationens lösningar är x = -3 och x = -2
            
            Svar: x ∈ {-3, -2}
            """
        },
        {
            "name": "Good B-Level Solution",
            "text": """
            x² + 5x + 6 = 0
            
            Jag ska lösa denna andragradsekvation med faktorisering.
            
            Först hittar jag två tal som multipliceras till 6 och adderas till 5.
            3 × 2 = 6 och 3 + 2 = 5
            
            Därför kan jag skriva: x² + 5x + 6 = (x + 3)(x + 2) = 0
            
            Lösningar:
            x + 3 = 0  →  x = -3
            x + 2 = 0  →  x = -2
            
            Kontroll:
            För x = -3: (-3)² + 5(-3) + 6 = 9 - 15 + 6 = 0 ✓
            För x = -2: (-2)² + 5(-2) + 6 = 4 - 10 + 6 = 0 ✓
            
            Svar: x = -3 eller x = -2
            """
        },
        {
            "name": "Basic C-Level Solution",
            "text": """
            x² + 5x + 6 = 0
            
            Jag använder faktorisering.
            3 × 2 = 6 och 3 + 2 = 5
            
            x² + 5x + 6 = (x + 3)(x + 2) = 0
            
            x = -3 eller x = -2
            
            Kontroll: (-3)² + 5(-3) + 6 = 0 ✓
            """
        },
        {
            "name": "Minimal D-Level Solution",
            "text": """
            x² + 5x + 6 = 0
            (x + 3)(x + 2) = 0
            x = -3, x = -2
            """
        },
        {
            "name": "Incorrect F-Level Solution",
            "text": """
            x² + 5x + 6 = 0
            x = 3 och 2
            """
        }
    ]
    
    print("COMPREHENSIVE ML SCORING TEST")
    print("=" * 80)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'-'*60}")
        print(f"TEST {i}: {test_case['name']}")
        print('-'*60)
        
        prediction = scoring_service.score_submission(test_case['text'], "mathematics")
        
        print(f"Score: {prediction.score} | Band: {prediction.band} | Confidence: {prediction.confidence}")
        print(f"Reason: {prediction.reason}")
        print(f"Processing Time: {prediction.processing_time_ms:.2f}ms")
        
        # Show key metrics
        if prediction.analysis_data and not prediction.analysis_data.get('error'):
            print(f"Key Metrics:")
            print(f"  Content Quality: {prediction.analysis_data.get('content_quality', 0):.2f}")
            print(f"  Math Rigor: {prediction.analysis_data.get('mathematical_rigor', 0):.2f}")
            print(f"  Structure: {prediction.analysis_data.get('structure_organization', 0):.2f}")
            print(f"  Completeness: {prediction.analysis_data.get('completeness', 0):.2f}")

if __name__ == "__main__":
    test_comprehensive_scoring()