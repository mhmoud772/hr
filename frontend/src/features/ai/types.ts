/** UI-facing types for the AI feature. Decoupled from API contracts. */

export interface AIResponse {
  status: string;
  answer: string;
  metadata: Record<string, unknown>;
  /** True if the response was generated from the mock fallback */
  isMock?: boolean;
}

export interface AIQueryRequest {
  prompt: string;
  includeContext?: boolean;
}

export type PolicyCategory =
  | "attendance"
  | "leaves"
  | "compensation"
  | "conduct"
  | "general";

export interface PolicyDocument {
  id: string;
  title: string;
  category: PolicyCategory;
  content: string;
  version: string;
  lastUpdated: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
