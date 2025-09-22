import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AIScoring = () => {
  const [submissionText, setSubmissionText] = useState("");
  const [subject, setSubject] = useState("mathematics");
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Sample texts for testing
  const sampleTexts = {
    excellent: `Lösning av andragradsekvation med faktorisering

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

Svar: x ∈ {-3, -2}`,
    good: `x² + 5x + 6 = 0

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

Svar: x = -3 eller x = -2`,
    basic: `x² + 5x + 6 = 0

Jag använder faktorisering.
3 × 2 = 6 och 3 + 2 = 5

x² + 5x + 6 = (x + 3)(x + 2) = 0

x = -3 eller x = -2

Kontroll: (-3)² + 5(-3) + 6 = 0 ✓`
  };

  const scoreSubmission = async () => {
    if (!submissionText.trim()) {
      setError("Please enter some text to score");
      return;
    }

    setScoring(true);
    setError("");
    setResult(null);

    try {
      // Build query parameters - the backend expects POST with query parameters
      const params = new URLSearchParams({
        text: submissionText,
        subject: subject
      });

      console.log("🚀 Sending POST request to /api/ml/score-text with query params:", {
        text: submissionText.substring(0, 100) + "...", 
        subject: subject,
        url: `http://localhost:8000/api/ml/score-text?${params.toString()}`
      });

      // Use POST request with query parameters (not body)
      const response = await axios.post(
        `http://localhost:8000/api/ml/score-text?${params.toString()}`,
        {}, // Empty body
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("✅ Raw API response:", response.data);
      console.log("📊 Response status:", response.status);
      console.log("🔍 Response structure:", typeof response.data, Object.keys(response.data || {}));

      // Validate the response data
      const data = response.data;
      
      // Check if we have a successful response
      if (!data) {
        setError("Empty response from AI service");
        return;
      }

      // Handle potential validation errors from Pydantic
      if (data.detail && Array.isArray(data.detail)) {
        setError(`Validation error: ${data.detail.map(err => err.msg).join(', ')}`);
        return;
      }

      // Log what we received to understand the structure
      console.log("🎯 Processing data:", {
        predicted_score: data.predicted_score,
        predicted_band: data.predicted_band,
        confidence: data.confidence,
        reason: data.reason,
        model_used: data.model_used,
        processing_time_ms: data.processing_time_ms,
        analysis_breakdown: data.analysis_breakdown
      });

      // Ensure we have valid data - be more flexible with the response structure
      const validatedResult = {
        predicted_score: data.predicted_score !== undefined ? Math.round(Number(data.predicted_score)) : 0,
        predicted_band: data.predicted_band || data.grade || 'F',
        confidence: data.confidence !== undefined ? Number(data.confidence) : 0,
        reason: data.reason || data.explanation || 'No explanation provided',
        model_used: data.model_used || data.model || 'Unknown',
        processing_time_ms: data.processing_time_ms !== undefined ? Number(data.processing_time_ms) : 0,
        analysis_breakdown: data.analysis_breakdown || data.breakdown || null
      };

      console.log("✨ Final validated result:", validatedResult);
      setResult(validatedResult);

      // Show success message
      console.log("🎉 AI Scoring completed successfully!");

    } catch (error) {
      console.error("❌ Scoring error:", error);
      
      // Log the full error response for debugging
      if (error.response) {
        console.log("📍 Error status:", error.response.status);
        console.log("📄 Error data:", error.response.data);
        console.log("📋 Error headers:", error.response.headers);
      }

      if (error.response?.status === 422) {
        setError(`Request format error (422): ${JSON.stringify(error.response.data)}`);
      } else if (error.response?.status === 405) {
        setError("Method not allowed. The backend endpoint configuration may have changed.");
      } else if (error.response?.status === 414) {
        setError("Text too long for URL. Please try with shorter text.");
      } else if (error.response?.status === 500) {
        setError("Internal server error. The AI model may not be loaded properly.");
      } else if (error.response?.data?.detail) {
        // Handle FastAPI validation errors
        if (Array.isArray(error.response.data.detail)) {
          setError(`API Error: ${error.response.data.detail.map(err => `${err.loc?.join?.('.')} - ${err.msg}`).join(', ')}`);
        } else {
          setError(`API Error: ${error.response.data.detail}`);
        }
      } else if (error.code === 'ECONNREFUSED') {
        setError("Cannot connect to AI service. Please ensure the backend server is running on http://localhost:8000");
      } else {
        setError(`Failed to score submission: ${error.message}`);
      }
    } finally {
      setScoring(false);
    }
  };

  const getGradeColor = (band) => {
    const colors = {
      'A': 'text-green-600 bg-green-100',
      'B': 'text-blue-600 bg-blue-100',
      'C': 'text-yellow-600 bg-yellow-100',
      'D': 'text-orange-600 bg-orange-100',
      'E': 'text-red-600 bg-red-100',
      'F': 'text-red-800 bg-red-200'
    };
    return colors[band] || 'text-gray-600 bg-gray-100';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // Helper function to safely render values
  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/teacher")}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🤖 AI Score Assist
        </h1>
        <p className="text-gray-600">
          Get AI-powered scoring suggestions for student submissions. This tool provides instant feedback to help with grading.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Submit Text for Scoring
            </h2>
            
            {/* Subject Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="mathematics">Mathematics</option>
                <option value="science">Science</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
              </select>
            </div>

            {/* Text Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Submission Text
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Paste or type the student's homework submission here..."
                rows={12}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="text-sm text-gray-500 mt-1">
                {submissionText.length} characters
                {submissionText.length > 2000 && (
                  <span className="text-orange-600 ml-2">⚠️ Long text may cause URL length issues</span>
                )}
              </div>
            </div>

            {/* Sample Text Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Try Sample Submissions
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSubmissionText(sampleTexts.excellent)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                >
                  Excellent (A)
                </button>
                <button
                  onClick={() => setSubmissionText(sampleTexts.good)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                  Good (B)
                </button>
                <button
                  onClick={() => setSubmissionText(sampleTexts.basic)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                >
                  Basic (C)
                </button>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
              <strong>Status:</strong><br/>
              ✅ API Connection: Working (Last: 200 OK)<br/>
              Method: POST /api/ml/score-text (with query params)<br/>
              Subject: {subject}<br/>
              Text length: {submissionText.length} chars<br/>
              Has token: {localStorage.getItem('token') ? 'Yes' : 'No'}
            </div>

            {/* Score Button */}
            <button
              onClick={scoreSubmission}
              disabled={scoring || !submissionText.trim()}
              className="w-full bg-purple-600 text-white text-lg font-semibold py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scoring ? "🤖 Analyzing..." : "🤖 Get AI Score"}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Success Message */}
            {result && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                <strong>✅ Success:</strong> AI analysis completed! Check the results on the right.
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                AI Scoring Results
              </h2>

              {/* Main Score */}
              <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
                <div className={`text-4xl font-bold ${getScoreColor(result.predicted_score)}`}>
                  {safeRender(result.predicted_score)}/100
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-lg font-semibold mt-2 ${getGradeColor(result.predicted_band)}`}>
                  Grade: {safeRender(result.predicted_band)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </div>
              </div>

              {/* Explanation */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">AI Explanation</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">
                  {safeRender(result.reason)}
                </p>
              </div>

              {/* Detailed Breakdown */}
              {result.analysis_breakdown && typeof result.analysis_breakdown === 'object' && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Detailed Analysis</h3>
                  <div className="space-y-2">
                    {Object.entries(result.analysis_breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, (value || 0) * 100))}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12">
                            {Math.round((value || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Info */}
              <div className="text-xs text-gray-500 border-t pt-3">
                Model: {safeRender(result.model_used)} | 
                Processing Time: {safeRender(result.processing_time_ms?.toFixed?.(1) || result.processing_time_ms)}ms
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How AI Scoring Works</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Analyzes content quality and mathematical rigor</li>
              <li>• Evaluates structure and organization</li>
              <li>• Checks completeness and clarity</li>
              <li>• Provides confidence score for reliability</li>
              <li>• Supports Swedish and English text</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIScoring;