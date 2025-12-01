import React from "react";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-6 bg-white">
      {/* Välkommen Sektion */}
      <div className="flex flex-col sm:flex-row items-center mb-12">
        <div className="sm:w-2/3">
          <h2 className="text-3xl font-semibold text-blue-800 mb-4">
            Välkommen till vår Plattform!
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Välkommen till vår innovativa lärplattform! Vi är glada att du har
            valt att använda vårt system som är designat för att göra utbildning
            mer effektiv, interaktiv och tillgänglig för både elever och lärare.
          </p>
          <p className="text-lg text-gray-700 mb-6">
            Vår plattform erbjuder en rad funktioner som underlättar planering,
            bedömning, kommunikation och uppföljning av elevernas framsteg.
            Oavsett om du är lärare, elev eller förälder, finns det verktyg här
            för att göra din upplevelse så smidig och engagerande som möjligt.
          </p>
          <p className="text-lg text-gray-700">
            Låt oss hjälpa dig att nå dina mål och ta nästa steg mot framgång!
          </p>
        </div>
        <img
          src="grundskolan.jpg"
          alt="Välkommen"
          className="sm:w-1/3 w-full h-auto object-cover rounded-md mt-6 sm:mt-0 sm:ml-6"
        />
      </div>

      {/* Funktioner Sektion */}
      <h2 className="text-3xl font-semibold text-center text-blue-800 mb-12">
        Viktiga Funktioner
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-blue-800 mb-4">
            För föräldrar
          </h3>
          <p className="text-gray-700">
            Som förälder kan du enkelt följa ditt barns framsteg, ta del av
            uppdateringar om deras utveckling och aktivt stötta deras lärande.
            Vår plattform ger dig den information du behöver för att hålla dig
            uppdaterad och vara delaktig i ditt barns utbildning.
          </p>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-blue-800 mb-4">För lärare</h3>
          <p className="text-gray-700">
            Du kan enkelt skapa läxor, bedöma elevernas prestationer och ge
            kontinuerlig feedback på ett strukturerat och effektivt sätt. Vår
            plattform gör det möjligt att följa upp och stödja elevernas
            utveckling genom hela lärprocessen.
          </p>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-blue-800 mb-4">För elever</h3>
          <p className="text-gray-700">
            Här hittar du din personliga lärplan, anpassade uppgifter och
            feedback som är utformade för att stödja dig på vägen mot att nå
            dina mål.
          </p>
        </div>
      </div>

      {/* Bild för Funktioner */}
      <div className="flex flex-col sm:flex-row items-center mt-12">
        <div className="sm:w-2/3">
          <h2 className="text-3xl font-semibold text-blue-800 mb-4">
            Upptäck alla funktioner
          </h2>
          <p className="text-lg text-gray-700">
            Vår plattform är utformad för att möta behoven hos både lärare,
            elever och föräldrar. Med våra verktyg kan du planera, kommunicera
            och följa upp på ett enkelt och effektivt sätt.
          </p>
        </div>
        <img
          src="/Upptäck.jpeg"
          alt="Funktioner"
          className="sm:w-1/3 w-full h-auto object-cover rounded-md mt-6 sm:mt-0 sm:ml-6"
        />
      </div>
    </section>
  );
};

export default FeaturesSection;
