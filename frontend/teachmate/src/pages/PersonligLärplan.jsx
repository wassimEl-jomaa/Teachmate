import React from "react";

const PersonligLärplan = () => {
  return (
    <div className="bg-gray-100">
      {/* Main Content */}
      <div className="mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Punkt Ett */}
        <div className="bg-white p-6 border rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold">
            Översikt av Personlig Lärplan:
          </h2>
          <p className="font-bold text-xl text-blue-500">Mål:</p>
          <p className="text-gray-700">
            Plattformen syftar till att erbjuda en personlig lärandeupplevelse
            genom att använda AI (Artificiell Intelligens) för att analysera
            varje elevs styrkor och svagheter.
          </p>
          <p className="text-gray-700">
            Baserat på denna analys skapar plattformen en skräddarsydd lärplan
            som är anpassad för den enskilda eleven. Planen fokuserar specifikt
            på områden där eleven behöver mest stöd eller förbättring.
          </p>
          <p className="font-bold text-xl text-blue-500">Hur det fungerar:</p>
          <p className="text-black font-bold">AI-analys:</p>
          <p className="text-gray-700">
            AI:n utvärderar elevens tidigare prestationer, inlärningstakt och
            preferenser. Till exempel, om en elev har svårt med matematik men
            excellerar i läsning, kommer AI:n att prioritera att erbjuda
            matematikrelaterat innehåll och övningar som passar deras nuvarande
            nivå.
          </p>
          <p className="text-black font-bold">Personligt Stöd:</p>
          <p className="text-gray-700">
            Lärplanen justeras dynamiskt för att anpassa svårighetsgraden på
            uppgifter eller lektioner beroende på hur väl eleven utvecklas,
            vilket säkerställer att varje elev får rätt nivå av utmaning.
          </p>
        </div>

        {/* Punkt Två */}
        <div className="bg-white p-6 border rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold">Progressionsspårning:</h2>
          <p className="font-bold text-xl text-blue-500">Mål:</p>
          <p className="text-gray-700">
            En av de viktigaste funktionerna i denna personliga
            lärandeupplevelse är progressionsspårning, där AI:n övervakar och
            följer elevens förbättring över tid.
          </p>
          <p className="text-gray-700">
            Systemet är utformat för att automatiskt justera svårighetsgraden på
            uppgifter och övningar baserat på elevens inlärningstakt. Om en elev
            gör framsteg, kan plattformen introducera svårare uppgifter; om
            eleven har svårigheter kan det erbjudas mer stöd eller lättare
            uppgifter för att säkerställa att de håller sig engagerade och
            förbättras utan frustration.
          </p>
          <p className="font-bold text-xl text-blue-500">Hur det fungerar:</p>
          <p className="text-black font-bold">Justering i realtid:</p>
          <p className="text-gray-700">
            AI-systemet samlar kontinuerligt data från elevens svar, uppgifter
            och provresultat. Denna data används för att avgöra vilka områden
            som behöver mer fokus och vilka som kan avanceras.
          </p>
          <p className="text-black font-bold">Anpassad Lärväg:</p>
          <p className="text-gray-700">
            När eleven gör framsteg, anpassar sig plattformen för att
            säkerställa att de alltid arbetar på en nivå som matchar deras
            aktuella förmåga.
          </p>
        </div>

        {/* Punkt Tre */}
        <div className="bg-white p-6 border rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold">Exempel i praktiken:</h2>
          <p className="text-black font-bold">
            Scenario 1 (En elev som har svårt):
          </p>
          <p className="text-gray-700">
            En elev har svårt med algebra. Plattformen identifierar detta och
            justerar svårighetsgraden på uppgifter, erbjuder ytterligare
            förklaringar, lättare övningar och extra träning för att hjälpa till
            att bygga deras självförtroende och färdigheter i algebra.
          </p>
          <p className="text-black font-bold">
            Scenario 2 (En elev som excellerar):
          </p>
          <p className="text-gray-700">
            En elev excellerar i läsförståelse. Plattformen upptäcker detta och
            introducerar mer komplexa texter eller utmaningar relaterade till
            djupare analys och tolkning, vilket hjälper dem att växa inom
            områden där de redan visar styrka.
          </p>
        </div>

        {/* Punkt Fyra */}
        <div className="bg-white p-6 border rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold">
            Fördelar med Personligt Lärande:
          </h2>
          <p className="text-black font-bold">
            Skräddarsydd Lärandeupplevelse:
          </p>
          <p className="text-gray-700">
            Varje elev får lektioner och uppgifter baserat på sina unika behov,
            vilket förbättrar inlärningsresultaten.
          </p>
          <p className="text-2xl font-semibold">Ökat Engagemang:</p>
          <p className="text-gray-700">
            Genom att erbjuda uppgifter som är lagom utmanande är eleverna mer
            benägna att hålla sig engagerade och motiverade att lära sig.
          </p>
          <p className="text-2xl font-semibold">Kontinuerlig Förbättring:</p>
          <p className="text-gray-700">
            Med AI som kontinuerligt spårar framsteg får eleverna alltid
            feedback, och justeringar görs vid behov för att hålla
            lärandeupplevelsen effektiv och relevant.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonligLärplan;
