import React from "react";

const ContactUs = () => {
  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-4xl font-semibold text-center mb-8 text-shadow-lg rounded-lg p-6 bg-gradient-to-r from-blue-400 to-indigo-600 text-white">
        Kontakta Oss
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-lg mb-4">
          Vi skulle gärna vilja höra från dig! Om du har några frågor eller
          behöver hjälp, vänligen fyll i formuläret nedan så återkommer vi till
          dig så snart som möjligt.
        </p>

        {/* Example contact form */}
        <form>
          <div className="mb-4">
            <label htmlFor="name" className="block text-lg">
              Namn
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-lg">
              E-post
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-lg">
              Meddelande
            </label>
            <textarea
              id="message"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              rows="4"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-8 py-3 rounded-md hover:bg-blue-600 transition-all"
          >
            Skicka Meddelande
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
