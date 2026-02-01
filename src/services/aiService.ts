import axios from 'axios';

const AI_SERVICE_BASE_URL = 'http://localhost:8000'; // AI service runs on port 8000

interface ProviderConfig {
  provider: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

interface ProviderStatus {
  provider: string;
  isAvailable: boolean;
  errorMessage?: string;
}

interface CurrentConfig {
  currentProvider: string;
  availableProviders: string[];
  providerConfigs: Record<string, any>;
}

interface TestResult {
  provider: string;
  status: 'working' | 'error';
  testResponse?: string;
  error?: string;
  canGenerate: boolean;
}

// Document Analysis Interface
type AiAnalysisResponse = {
  document_id: number;
  version_id: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
  summary?: string;
  raw_result?: string;
  error?: string;
  created_at: string;
  updated_at: string;
};

class AIServiceAPI {
  private axiosInstance = axios.create({
    baseURL: AI_SERVICE_BASE_URL,
    timeout: 30000, // 30 second timeout
  });

  // Get available AI providers
  async getAvailableProviders(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/ai/providers');
      return response.data.providers;
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw new Error('Failed to fetch AI providers');
    }
  }

  // Get current configuration
  async getCurrentConfig(): Promise<CurrentConfig> {
    try {
      const response = await this.axiosInstance.get('/ai/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching config:', error);
      throw new Error('Failed to fetch AI configuration');
    }
  }

  // Set active provider
  async setProvider(provider: string, config?: ProviderConfig): Promise<any> {
    try {
      const response = await this.axiosInstance.post(`/ai/provider/${provider}`, config);
      return response.data;
    } catch (error: any) {
      console.error('Error setting provider:', error);
      throw new Error(error.response?.data?.detail || 'Failed to set AI provider');
    }
  }

  // Test a specific provider
  async testProvider(provider: string): Promise<TestResult> {
    try {
      const response = await this.axiosInstance.post(`/ai/test-provider/${provider}`);
      return response.data;
    } catch (error: any) {
      console.error('Error testing provider:', error);
      throw new Error(error.response?.data?.detail || `Failed to test ${provider} provider`);
    }
  }

  // Get status of all providers
  async getProviderStatus(): Promise<ProviderStatus[]> {
    try {
      const response = await this.axiosInstance.get('/ai/status');
      return response.data.providers;
    } catch (error) {
      console.error('Error fetching provider status:', error);
      throw new Error('Failed to fetch provider status');
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/health');
      return true;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }

  // Document Analysis Methods
  async startDocumentAnalysis(documentId: number, versionId: number, provider?: string): Promise<AiAnalysisResponse> {
    try {
      // For now, we'll make a direct call to the backend since the AI service
      // doesn't expose document analysis endpoints directly
      const url = provider
        ? `http://localhost:8080/api/ai/document/${documentId}/versions/${versionId}/analyze?provider=${provider}`
        : `http://localhost:8080/api/ai/document/${documentId}/versions/${versionId}/analyze`;

      const backendResponse = await axios.post<AiAnalysisResponse>(url, null, {
        withCredentials: true,
      });
      return backendResponse.data;
    } catch (error: any) {
      console.error('Error starting document analysis:', error);
      throw new Error(error.response?.data?.detail || 'Failed to start document analysis');
    }
  }

  async getAnalysisResult(documentId: number, versionId: number): Promise<AiAnalysisResponse> {
    try {
      const backendResponse = await axios.get<AiAnalysisResponse>(
        `http://localhost:8080/api/ai/document/${documentId}/versions/${versionId}/analysis`,
        { withCredentials: true }
      );
      return backendResponse.data;
    } catch (error: any) {
      console.error('Error fetching analysis result:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch analysis result');
    }
  }

  async startDocumentReview(documentId: number, versionId: number, provider?: string, topic?: string): Promise<AiAnalysisResponse> {
    try {
      let url = `http://localhost:8080/api/ai/document/${documentId}/versions/${versionId}/review`;
      const params = new URLSearchParams();
      if (provider) params.append('provider', provider);
      if (topic) params.append('topic', topic);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const backendResponse = await axios.post<AiAnalysisResponse>(url, null, {
        withCredentials: true,
      });
      return backendResponse.data;
    } catch (error: any) {
      console.error('Error starting document review:', error);
      throw new Error(error.response?.data?.detail || 'Failed to start document review');
    }
  }

  async sendDocumentChatMessage(documentId: number, versionId: number, content: string): Promise<any> {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/ai/document/${documentId}/versions/${versionId}/chat`,
        content,
        {
          headers: { 'Content-Type': 'text/plain' },
          withCredentials: true
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error sending document chat message:', error);
      throw new Error(error.response?.data?.detail || 'Failed to send chat message');
    }
  }

  async getDocumentChatHistory(documentId: number): Promise<any[]> {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/ai/document/${documentId}/chat`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching document chat history:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch chat history');
    }
  }
}

export const aiServiceAPI = new AIServiceAPI();
export type { ProviderConfig, ProviderStatus, CurrentConfig, TestResult, AiAnalysisResponse };