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

  // Recommended resources for each subject and grade band
  const recommendedResources = {
    mathematics: {
      A: [
        { title: "Advanced Algebra", link: "https://www.khanacademy.org/math/algebra" },
        { title: "Challenging Math Problems", link: "https://brilliant.org/" }
      ],
      B: [
        { title: "Intermediate Algebra", link: "https://www.khanacademy.org/math/algebra" },
        { title: "Practice Problems", link: "https://www.ixl.com/math/" }
      ],
      C: [
        { title: "Basic Algebra Concepts", link: "https://www.khanacademy.org/math/pre-algebra" },
        { title: "Math Fundamentals", link: "https://www.mathsisfun.com/" }
      ],
      D: [
        { title: "Introduction to Algebra", link: "https://www.khanacademy.org/math/pre-algebra" },
        { title: "Learn Math Basics", link: "https://www.mathplanet.com/" }
      ],
      E: [
        { title: "Foundational Math Skills", link: "https://www.khanacademy.org/math/early-math" },
        { title: "Basic Arithmetic", link: "https://www.mathsisfun.com/" }
      ],
      F: [
        { title: "Start with Math Basics", link: "https://www.khanacademy.org/math/early-math" },
        { title: "Learn Arithmetic", link: "https://www.mathplanet.com/" }
      ]
    }
  };

  const getRecommendedResources = (subject, gradeBand) => {
    if (!recommendedResources[subject] || !recommendedResources[subject][gradeBand]) {
      return [];
    }
    return recommendedResources[subject][gradeBand];
  };

  const generateFeedback = (result) => {
    if (!result) return [];

    const feedback = [];

    // Feedback based on grade band
    const gradeFeedback = {
      A: "Excellent work! Your solution is well-structured and demonstrates a deep understanding. Keep up the great work!",
      B: "Good job! Your solution is clear and mostly complete. Focus on refining details for an even better result.",
      C: "Your solution is acceptable but could use more detail and clarity. Review the key concepts and try to elaborate further.",
      D: "Your solution shows some understanding but lacks depth and structure. Consider revisiting the topic and practicing similar problems.",
      E: "Your solution is incomplete and misses key elements. Focus on understanding the basics and building a stronger foundation.",
      F: "Your solution does not meet the requirements. Start by reviewing the fundamental concepts and seek help if needed."
    };

    feedback.push(gradeFeedback[result.predicted_band] || "No feedback available for this grade.");

    // Feedback based on keyword coverage
    const keywordCoverage = result.analysis_breakdown?.keyword_coverage || 0;
    if (keywordCoverage >= 0.7) {
      feedback.push("Great job including relevant keywords! This demonstrates a strong understanding of the topic.");
    } else if (keywordCoverage >= 0.4) {
      feedback.push("You included some relevant keywords, but there’s room to add more to strengthen your solution.");
    } else {
      feedback.push("Your solution is missing many important keywords. Try to include more relevant terms to show your understanding.");
    }

    // Feedback based on structure quality
    const structureQuality = result.analysis_breakdown?.structure_quality || 0;
    if (structureQuality >= 0.7) {
      feedback.push("Your solution is well-structured with clear steps. This makes it easy to follow and understand.");
    } else if (structureQuality >= 0.4) {
      feedback.push("Your solution has some structure, but it could be improved by organizing it into clearer steps.");
    } else {
      feedback.push("Your solution lacks structure. Consider breaking it into steps or sections for better clarity.");
    }

    return feedback;
  };

  const saveFeedbackToDatabase = async (validatedResult) => {
  try {
    const feedbackText = generateFeedback(validatedResult).join(" ");
    const improvementSuggestions = getRecommendedResources(subject, validatedResult.predicted_band)
      .map((resource) => resource.title)
      .join(", ");

    const feedbackPayload = {
      homework_submission_id: validatedResult.homework_submission_id, // Ensure this is not null
      feedback_text: feedbackText,
      improvement_suggestions: improvementSuggestions,
      model_used: validatedResult.model_used || "Unknown Model"
    };

    console.log("Payload being sent:", feedbackPayload); // Debugging log

    await axios.post(`http://${process.env.BASE_URL}:8000/api/ml/save-feedback`, feedbackPayload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Failed to save feedback:", error);
  }
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
      const params = new URLSearchParams({
        text: submissionText,
        subject: subject
      });

      const response = await axios.post(
        `http://${process.env.BASE_URL}:8000/api/ml/score-text?${params.toString()}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          },
          timeout: 5000
        }
      );

      const data = response.data;
      const validatedResult = {
        predicted_score: data.predicted_score !== undefined ? Math.round(Number(data.predicted_score)) : 0,
        predicted_band: data.predicted_band || "F",
        confidence: data.confidence !== undefined ? Number(data.confidence) : 0,
        reason: data.reason || "No explanation provided",
        model_used: data.model_used || "Backend AI Model",
        processing_time_ms: data.processing_time_ms !== undefined ? Number(data.processing_time_ms) : 0,
        analysis_breakdown: data.analysis_breakdown || null,
        homework_submission_id: data.homework_submission_id || null // Ensure submission ID is included
      };

      setResult(validatedResult);

      // Save feedback to the database
      await saveFeedbackToDatabase(validatedResult);
    } catch (error) {
      setError("Failed to score the submission. Please try again.");
    } finally {
      setScoring(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate("/teacher")} className="text-blue-600 hover:text-blue-800 mb-4 flex items-center">
          ← Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🤖 AI Score Assist</h1>
        <p className="text-gray-600">Get AI-powered scoring suggestions for student submissions. This tool provides instant feedback to help with grading.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Submit Text for Scoring</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Student Submission Text</label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Paste or type the student's homework submission here..."
                rows={12}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => scoreSubmission()}
              disabled={scoring || !submissionText.trim()}
              className="w-full bg-purple-600 text-white text-lg font-semibold py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scoring ? "🤖 Analyzing..." : "🤖 Submit for Scoring"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">📊 Scoring Results</h2>
              <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-4xl font-bold text-green-600">{result.predicted_score}/100</div>
                <div className="inline-block px-3 py-1 rounded-full text-lg font-semibold mt-2 bg-green-100 text-green-600">
                  Grade: {result.predicted_band}
                </div>
              </div>
              <div className="bg-yellow-50 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-yellow-800 mb-4">📋 Personalized Feedback</h2>
                <ul className="list-disc pl-5 space-y-2 text-yellow-700">
                  {generateFeedback(result).map((feedback, index) => (
                    <li key={index}>{feedback}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg shadow-lg mt-6">
                <h2 className="text-2xl font-semibold text-blue-800 mb-4">📚 Recommended Resources</h2>
                <ul className="list-disc pl-5 space-y-2 text-blue-700">
                  {getRecommendedResources(subject, result.predicted_band).map((resource, index) => (
                    <li key={index}>
                      <a
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIScoring;