import type {
  ApiAIResponse,
  ApiPolicyDocument,
} from "@/types/contracts";
import type {
  AIResponse,
  PolicyDocument as AIPolicyDocument,
} from "@/features/ai/types";
import {
  asRecord,
  toOptionalBoolean,
  toOptionalRecord,
  toOptionalString,
  toRequiredString,
} from "./base";

export function normalizeAIResponse(
  raw: ApiAIResponse | Record<string, unknown>,
): AIResponse {
  const record = asRecord(raw);
  const metadata =
    (toOptionalRecord(record.metadata) as Record<string, unknown>) ?? {};

  return {
    status: toRequiredString(record.status, "success"),
    answer: toRequiredString(record.answer),
    metadata,
    isMock:
      toOptionalBoolean(record.mock) ??
      toOptionalBoolean(metadata.mock) ??
      false,
  };
}

export function normalizePolicyDocument(
  raw: ApiPolicyDocument | Record<string, unknown>,
): AIPolicyDocument {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    title: toRequiredString(record.title),
    category: (toOptionalString(record.category) as AIPolicyDocument["category"]) ?? "general",
    content: toRequiredString(record.content),
    version: toRequiredString(record.version, "1.0.0"),
    lastUpdated: toRequiredString(record.last_updated ?? record.lastUpdated),
    createdAt: toRequiredString(record.created_at ?? record.createdAt),
  };
}
