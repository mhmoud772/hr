import { apiClient } from '@/shared/lib/api-client';
import { normalizeAIResponse, normalizePolicyDocument } from '@/shared/lib/normalizers/ai';
import type { ApiAIQueryRequest, ApiAIResponse, ApiPolicyDocument } from '@/types/contracts';
import type { AIResponse, AIQueryRequest, PolicyDocument } from '../types';

/**
 * Typed AI API service.
 * Maps between UI-facing domain types and backend contract types.
 */
export const aiApi = {
  /**
   * Send a natural language query to the AI assistant.
   */
  query: async (data: AIQueryRequest): Promise<AIResponse> => {
    const payload: ApiAIQueryRequest = {
      prompt: data.prompt,
      include_context: data.includeContext ?? true,
    };
    const response = await apiClient.post<ApiAIResponse>('/ai/query/', payload);
    return normalizeAIResponse(response.data);
  },

  /**
   * Get an AI-generated executive dashboard summary.
   */
  getDashboardSummary: async (): Promise<AIResponse> => {
    const response = await apiClient.get<ApiAIResponse>('/ai/dashboard-summary/');
    return normalizeAIResponse(response.data);
  },

  /**
   * Get the list of active HR policy documents.
   */
  getPolicies: async (): Promise<PolicyDocument[]> => {
    const response = await apiClient.get<ApiPolicyDocument[]>('/ai/policies/');
    const rawList = Array.isArray(response.data) ? response.data : [];
    return rawList.map(normalizePolicyDocument);
  },
};
