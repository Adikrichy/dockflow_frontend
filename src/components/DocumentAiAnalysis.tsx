import React, { useState, useEffect } from 'react';
import { aiServiceAPI } from '../services/aiService';
import type { AiAnalysisResponse } from '../services/aiService';

interface DocumentAiAnalysisProps {
  documentId: number;
  versionId: number;
}

const DocumentAiAnalysis: React.FC<DocumentAiAnalysisProps> = ({ documentId, versionId }) => {
  const [analysis, setAnalysis] = useState<AiAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const response = await aiServiceAPI.startDocumentAnalysis(documentId, versionId);
      setAnalysis(response);
      
      // Start polling for results
      pollAnalysisStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to start AI analysis');
      console.error('AI analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pollAnalysisStatus = () => {
    const interval = setInterval(async () => {
      try {
        const result = await aiServiceAPI.getAnalysisResult(documentId, versionId);
        setAnalysis(result);
        
        // Stop polling when analysis is complete
        if (result.status === 'SUCCESS' || result.status === 'ERROR') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling failed:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes maximum
    setTimeout(() => {
      clearInterval(interval);
    }, 300000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'ERROR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Queued';
      case 'PROCESSING': return 'Analyzing';
      case 'SUCCESS': return 'Complete';
      case 'ERROR': return 'Failed';
      default: return status;
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Document Analysis</h3>
        <button
          onClick={startAnalysis}
          disabled={isAnalyzing || analysis?.status === 'PROCESSING'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isAnalyzing ? 'Starting...' : 'Analyze Document'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`}>
              {getStatusText(analysis.status)}
            </span>
            <span className="text-sm text-gray-500">
              Started: {new Date(analysis.created_at).toLocaleString()}
            </span>
          </div>

          {analysis.status === 'PROCESSING' && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 text-sm">AI is analyzing your document...</span>
            </div>
          )}

          {analysis.status === 'SUCCESS' && analysis.summary && (
            <div className="p-3 bg-green-50 rounded-md">
              <h4 className="font-medium text-green-800 mb-2">Analysis Summary</h4>
              <p className="text-green-700 text-sm">{analysis.summary}</p>
            </div>
          )}

          {analysis.status === 'ERROR' && analysis.error && (
            <div className="p-3 bg-red-50 rounded-md">
              <h4 className="font-medium text-red-800 mb-2">Analysis Failed</h4>
              <p className="text-red-700 text-sm">{analysis.error}</p>
              <button
                onClick={startAnalysis}
                className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
              >
                Retry Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {!analysis && !isAnalyzing && (
        <div className="text-center py-8 text-gray-500">
          <p>No analysis performed yet</p>
          <p className="text-sm mt-1">Click "Analyze Document" to start AI analysis</p>
        </div>
      )}
    </div>
  );
};

export default DocumentAiAnalysis;