import React from "react";
import { Link } from "react-router-dom";

const AboutUs = () => {
  return (
    <div className="container mx-auto px-6 py-10">
      {/* Title Section */}
      <h1 className="text-4xl font-bold text-center mb-8 text-black bg-gradient-to-r from-blue-400 to-indigo-600 p-6 rounded-lg shadow-lg text-white">
        Om Oss
      </h1>

      {/* Section 1 - Vision */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Left Side: Text Content */}
          <div className="md:w-2/3">
            <p className="text-lg mb-4">
              <strong>EduMate Grundskola</strong> är en digital lärplattform som
              förenklar och effektiviserar kommunikationen, dokumentationen,
              administrationen och genomförandet av undervisning. Vi erbjuder en
              helhetslösning för lärare, elever och skolledare som sparar tid
              och gör vardagen mer effektiv.
            </p>

            <p className="text-lg mb-4">
              Det unika med EduMate för grundskolan är att hela plattformen är
              strukturerad kring läroplanen, vilket kopplar samman hela
              processen från planering till bedömning på ett smartare och mer
              organiserat sätt. Genom att använda vår plattform kan lärare och
              skolledare arbeta mer effektivt och fokusera på det som verkligen
              betyder något — att stödja och utveckla eleverna.
            </p>

            <p className="text-lg">
              Med hjälp av avancerad teknologi, som artificiell intelligens,
              erbjuder vi en skräddarsydd upplevelse för varje elev. Genom att
              analysera individuella framsteg och behov skapar vi en personlig
              lärplan som anpassas kontinuerligt för att optimera resultaten.
              Vårt mål är att ge eleverna de verktyg de behöver för att lyckas
              på alla nivåer.
            </p>
          </div>

          {/* Right Side: Image */}
          <div className="md:w-1/3 mt-6 md:mt-0">
            <img
              src="/student.webp"
              alt="Vision Image"
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Section 2 - Our Team and Future Plans */}
      <div className="bg-gray-100 p-8 rounded-lg mt-10 shadow-md">
        <h2 className="text-3xl font-semibold text-center text-blue-600 mb-6">
          Vårt Team & Framtidsplaner
        </h2>
        <p className="text-lg mb-4 text-center">
          Vi är ett dedikerat team av erfarna teknologer och pedagoger som
          tillsammans strävar efter att förändra utbildning för framtiden. Vår
          plattform är ständigt under utveckling för att möta de nya behoven
          inom utbildning, och vi har stora planer på att lägga till ännu fler
          funktioner för att förbättra användarupplevelsen och göra lärandet
          ännu mer engagerande och effektivt.
        </p>
        <p className="text-lg text-center">
          Tillsammans arbetar vi för att bygga en bättre framtid för våra elever
          och ge dem alla de verktyg de behöver för att lyckas, genom att skapa
          en plattform som gör lärande enklare, mer effektivt och mer
          tillgängligt.
        </p>
      </div>

      {/* Call to Action: Contact Us Button */}
      <div className="text-center mt-10">
        <Link to="/contactUs">
          <button className="bg-blue-500 text-white px-8 py-3 rounded-md hover:bg-blue-600 transition-all duration-300 transform hover:scale-105">
            Kontakta Oss
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AboutUs;
