import React from "react";
import { Link } from "react-router-dom";

const HurDetFungerarSektion = () => {
  return (
    <section id="om" className="py-20 px-6 bg-blue-50">
      <h2 className="text-3xl font-semibold text-center text-blue-800 mb-8">
        Så Här Fungerar Det
      </h2>
      <div className="text-center max-w-3xl mx-auto mb-12">
        <p className="text-lg text-gray-700 mb-4">
          Vi är här för att ge dig alla de verktyg du behöver för att lyckas,
          och vi ser fram emot att hjälpa dig på din lärande- och
          utbildningsresa.
        </p>
      </div>

      <div className="mx-auto p-6 space-y-12">
        {/* Punkt Ett */}
        <div className="flex flex-col sm:flex-row items-center bg-white p-6 border rounded-lg shadow-md">
          <div className="sm:w-2/3">
            <h2 className="text-2xl font-semibold">
              Struktur för planering, bedömning och lärande
            </h2>
            <p className="mt-4 text-gray-700">
              Vår plattform erbjuder en unik funktion för planering, där läraren
              direkt taggar specifika kriterier till varje uppgift. Detta
              kopplar ihop lärandet och utvecklingen med de mål och
              bedömningskriterier som är definierade för uppgiften. Genom denna
              koppling får både lärare och elever en tydlig röd tråd, vilket
              underlättar löpande bedömning. Detta skapar en strukturerad och
              sammanhängande process för planering, bedömning och lärande.
              Förutom att stödja lärande och bedömning har vår plattform flera
              funktioner för samarbete och kommunikation mellan alla användare.
              Vi vet att rätt kommunikationskanaler är viktiga, och i dagens
              samhälle är mobiltelefonen den mest effektiva kanalen för att
              hålla alla uppdaterade. Därför är vårt system fullt optimerat för
              att fungera smidigt på mobilen, vilket gör det enkelt för både
              elever och föräldrar att följa upp och hålla kontakten med lärare
              och andra i utbildningen. Genom att erbjuda en mobilvänlig,
              användarcentrerad plattform ser vi till att både elever och
              föräldrar har den information de behöver, när de behöver den.
            </p>
          </div>
          <img
            src="/kommunikation_planering.png"
            alt="Struktur för planering"
            className="sm:w-1/3 w-full h-auto object-cover rounded-md mt-6 sm:mt-0 sm:ml-6"
          />
        </div>

        

        {/* Punkt Tre */}
        <div className="flex flex-col sm:flex-row items-center bg-white p-6 border rounded-lg shadow-md">
          <div className="sm:w-2/3">
            <h2 className="text-2xl font-semibold">
              Ett riktigt vasst analysverktyg
            </h2>
            <p className="mt-4 text-gray-700">
              Med vår Analysfunktion får du helt nya möjligheter att arbeta med
              statistik och skapa underlag för både individuellt lärande,
              förbättringsarbete och skolutveckling. Genom att välja mellan ett
              brett utbud av rapporter kan du skräddarsy och anpassa underlaget
              för ditt eget analysarbete. Vår analysfunktion är ett kraftfullt
              verktyg som gör det möjligt att exempelvis filtrera fram de fem
              kriterier där flest elever behöver stöd i varje årskurs på
              skolnivå. Detta ger skolan ett konkret underlag för att
              identifiera var insatser behövs och rikta resurserna mot de
              områden som har störst behov av förbättring. I tillvalet
              kommunanalys kan du till exempel välja ut en specifik årskurs inom
              kommunen och få en detaljerad översikt över de fem kriterier som
              kräver mest stöd för eleverna i den årskursen. Detta ger en tydlig
              bild av vilka områden som behöver prioriteras för att säkerställa
              att alla elever får det stöd de behöver.
            </p>
          </div>
          <img
            src="Analysverktyg.png"
            alt="Analysverktyg"
            className="sm:w-1/3 w-full h-auto object-cover rounded-md mt-6 sm:mt-0 sm:ml-6"
          />
        </div>
      </div>
    </section>
  );
};

export default HurDetFungerarSektion;
