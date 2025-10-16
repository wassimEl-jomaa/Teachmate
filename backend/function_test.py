import re


def calculate_method_appropriateness(submission_text: str, homework_description: str) -> float:
    if not submission_text or submission_text.strip() == "":
        return 0.0

    text = submission_text.lower()
    desc = homework_description.lower()

    # --- Wrong method markers ---
    if "istället" in text or "instead" in text:
        return 0.0

    if any(word in text for word in ["guess", "gissa", "trial", "provar"]):
        return 0.5

    # --- Algebra / Equations ---
    if "ekvation" in desc or re.search(r"[0-9]*x[\+\-\*/]?[0-9]*\s*=\s*[0-9]", text):
        return 1.0

    # --- Percent / Procent ---
    if "%" in text or "procent" in text:
        return 1.0

    # --- Geometry ---
    if any(sym in text for sym in ["π", "area", "volym", "c²", "triangel", "cirkel", "kub", "radie", "diameter"]):
        return 1.0

    # --- Statistics ---
    if any(word in text for word in ["sannolikhet", "varians", "medelvärde", "mean", "average"]):
        return 1.0
    if re.search(r"\(.+\)\s*/\s*\d+", text):   # formula like (a+b+c)/n
        return 1.0
    if re.match(r"\d+/\d+", text.strip()):     # probability like 1/6
        return 1.0

    # --- Functions / Graphs ---
    if any(word in text for word in ["graf", "funktion", "plot"]) or "y=" in text or "f(x" in text:
        return 1.0

    # --- Proportional reasoning (speed, time, distance) ---
    if any(word in text for word in ["km", "tim", "hastighet", "tempo", "fart"]):
        return 1.0

    # Default fallback
    return 0.5

tests = [
    # --- Ekvationer ---
    ("Lös ekvationen 2x + 5 = 11", "2x + 5 = 11\n2x = 6\nx = 3", 1.0),
    ("Solve equation x + 3 = 7", "Provar x=1,2,3 tills rätt", 0.5),
    ("Solve equation x² + 3x + 2 = 0", "(x+1)(x+2)=0 → x=-1,-2", 1.0),
    ("Solve equation", "Jag använde Pythagoras sats", 0.0),

    # --- Procent ---
    ("Räkna ut 10% av 50 kr", "10% av 50 = 5", 1.0),
    ("Beräkna moms 25% på 400 kr", "400 * 0.25 = 100", 1.0),
    ("Öka 200 med 10%", "200 * 1.1 = 220", 1.0),
    ("Räkna ut 30% av 90 kr", "Jag använde Pythagoras", 0.0),

    # --- Geometri ---
    ("Beräkna hypotenusan, a=3, b=4", "c²=3²+4² → c=5", 1.0),
    ("Beräkna arean av en cirkel", "A=πr², r=5 → 78.5", 1.0),
    ("Volym av kub med sidan 3", "3*3*3=27", 1.0),
    ("Area av triangel", "Provar med procent istället", 0.0),

    # --- Statistik ---
    ("Beräkna medelvärdet av talen 2,4,6", "(2+4+6)/3=4", 1.0),
    ("Beräkna varians", "Summan av (x-mean)²/n", 1.0),
    ("Sannolikhet för tärning (6)", "1/6", 1.0),
    ("Medelvärde av data", "Jag ritade graf istället", 0.3),

    # --- Funktioner ---
    ("Rita grafen y=2x+1", "Linjär funktion, plottar punkter", 1.0),
    ("Analysera parabeln y=x²-4", "Hittar nollställen, ritar graf", 1.0),
    ("Funktion f(x)=3x+2", "Provar med gissa och testa", 0.5),
    ("Linjära funktioner", "Jag räknade sannolikhet", 0.0),

    # --- Problemlösning ---
    ("En bil kör 60 km på 1 timme, hur långt på 2.5 tim?", "60*2.5=150 km", 1.0),
    ("En klass har 12 pojkar, 18 flickor. Procent pojkar?", "12/30=0.4=40%", 1.0),
    ("Köp 3 varor á 20 kr med 10% rabatt", "3*20=60, rabatt=6 → 54", 1.0),
    ("Problemlösning", "Jag använde Pythagoras på fel sätt", 0.0),
]

# Expand with random variations to reach ~100 tests
for i in range(5, 101):
    if i % 6 == 0:
        tests.append((f"Equation test {i}", "2x=6 → x=3", 1.0))
    elif i % 6 == 1:
        tests.append((f"Percent test {i}", "10% av 200 = 20", 1.0))
    elif i % 6 == 2:
        tests.append((f"Geometry test {i}", "c²=3²+4²", 1.0))
    elif i % 6 == 3:
        tests.append((f"Stat test {i}", "(1+2+3)/3=2", 1.0))
    elif i % 6 == 4:
        tests.append((f"Function test {i}", "y=2x+1, plot", 1.0))
    else:
        tests.append((f"Wrong method {i}", "Jag använde gissa", 0.5))

# Run all tests
for idx, (desc, sub, expected) in enumerate(tests, 1):
    result = calculate_method_appropriateness(sub, desc)
    print(f"Test {idx}: {desc}")
    print(f"  Submission: {sub}")
    print(f"  Expected: {expected}, Got: {result}\n")