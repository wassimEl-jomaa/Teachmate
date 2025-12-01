import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader, AlertCircle, Info, TrendingUp } from 'lucide-react';

const ScoreAssist = ({ submissionId, onPredictionLoaded }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (submissionId) {
      loadExistingPrediction();
    }
  }, [submissionId]);

  const loadExistingPrediction = async () => {
    try {
      // Try to load existing prediction from your backend
      const response = await fetch(`http://${process.env.BASE_URL}:8000/api/ml/score-submission?submission_id=${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrediction({
          predicted_score: data.predicted_score,
          predicted_band: data.predicted_band,
          confidence: data.confidence,
          reason: data.reason,
          model_used: data.model_used,
          timestamp: new Date().toISOString()
        });
        onPredictionLoaded?.(data);
      }
    } catch (err) {
      // No existing prediction is not an error
      console.log('No existing prediction found');
    }
  };

  const requestPrediction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${process.env.BASE_URL}:8000/api/ml/score-submission`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submission_id: submissionId,
          subject: 'mathematics'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get AI prediction');
      }
      
      const data = await response.json();
      
      // Format the response to match expected structure
      const formattedPrediction = {
        predicted_score: data.predicted_score,
        predicted_band: data.predicted_band,
        confidence: data.confidence,
        reason: data.reason,
        model_used: data.model_used,
        timestamp: new Date().toISOString(),
        analysis_breakdown: data.analysis_breakdown
      };
      
      setPrediction(formattedPrediction);
      onPredictionLoaded?.(formattedPrediction);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ScoreBadge = ({ band, score }) => {
    const getBandColor = (band) => {
      const colors = {
        'A': 'bg-green-100 text-green-800 border-green-200',
        'B': 'bg-blue-100 text-blue-800 border-blue-200',
        'C': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'D': 'bg-orange-100 text-orange-800 border-orange-200',
        'E': 'bg-red-100 text-red-600 border-red-200',
        'F': 'bg-red-200 text-red-800 border-red-300'
      };
      return colors[band] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBandColor(band)}`}>
        {score ? `${band} (${score}p)` : band}
      </span>
    );
  };

  const ConfidenceBar = ({ confidence }) => {
    const percentage = Math.round(confidence * 100);
    const getConfidenceColor = () => {
      if (confidence >= 0.8) return 'bg-green-500';
      if (confidence >= 0.6) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">Säkerhet:</span>
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getConfidenceColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 font-medium">{percentage}%</span>
      </div>
    );
  };

  const AnalysisBreakdown = ({ breakdown }) => {
    if (!breakdown) return null;

    const formatLabel = (key) => {
      const labels = {
        'content_quality': 'Innehållskvalitet',
        'mathematical_rigor': 'Matematisk precision',
        'structure_organization': 'Struktur & organisation',
        'language_clarity': 'Språklig klarhet',
        'subject_relevance': 'Ämnesrelevans',
        'completeness': 'Fullständighet'
      };
      return labels[key] || key;
    };

    return (
      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
        <h4 className="font-medium text-gray-900 mb-3">Detaljerad analys:</h4>
        <div className="space-y-2">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{formatLabel(key)}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-8">
                  {Math.round(value * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">AI-förslag (Beta)</h3>
            <p className="text-sm text-blue-700">Automatisk bedömningsassistent</p>
          </div>
          <div className="group relative">
            <Info className="h-4 w-4 text-blue-600 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
              AI-systemet analyserar innehåll, matematisk precision, struktur och språkbruk för att föreslå en bedömning. 
              Detta är endast ett förslag - din professionella bedömning är alltid den slutgiltiga.
            </div>
          </div>
        </div>
        
        {!prediction && !loading && (
          <button
            onClick={requestPrediction}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Lightbulb className="h-4 w-4" />
            <span>Få AI-förslag</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center space-x-3 py-8">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
          <div className="text-center">
            <p className="text-blue-700 font-medium">Analyserar inlämning...</p>
            <p className="text-sm text-blue-600">Detta kan ta några sekunder</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Kunde inte generera AI-förslag</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={requestPrediction}
            className="ml-auto px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
          >
            Försök igen
          </button>
        </div>
      )}

      {prediction && (
        <>
          {prediction.predicted_score !== null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <ScoreBadge 
                  band={prediction.predicted_band} 
                  score={prediction.predicted_score} 
                />
                <ConfidenceBar confidence={prediction.confidence} />
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-gray-900 mb-2">Analys & Motivering:</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{prediction.reason}</p>
              </div>

              {/* Show detailed breakdown if available */}
              {prediction.analysis_breakdown && (
                <AnalysisBreakdown breakdown={prediction.analysis_breakdown} />
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-blue-100">
                <span className="flex items-center space-x-1">
                  <span>Modell:</span>
                  <span className="font-medium">{prediction.model_used}</span>
                </span>
                <span>
                  Genererad: {new Date(prediction.timestamp).toLocaleString('sv-SE')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-amber-800 font-medium">Ingen förutsägelse tillgänglig</p>
                <p className="text-sm text-amber-700">{prediction.reason}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScoreAssist;