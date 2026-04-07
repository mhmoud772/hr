import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeAIResponse, normalizePolicyDocument } from "@/shared/lib/normalizers/ai";

// ── Mock the apiClient ──
const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock("@/shared/lib/api-client", () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe("AI API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("aiApi.query", () => {
    it("sends correct payload and normalizes response", async () => {
      const rawResponse = {
        status: "success",
        answer: "Based on the data, attendance is at 95%",
        metadata: { tokens: 150, sources: ["snapshot"] },
      };
      mockPost.mockResolvedValueOnce({ data: rawResponse });

      const { aiApi } = await import("./ai");
      const result = await aiApi.query({ prompt: "How is attendance?", includeContext: true });

      expect(mockPost).toHaveBeenCalledWith("/ai/query/", {
        prompt: "How is attendance?",
        include_context: true,
      });
      expect(result.status).toBe("success");
      expect(result.answer).toBe("Based on the data, attendance is at 95%");
      expect(result.metadata).toEqual({ tokens: 150, sources: ["snapshot"] });
      expect(result.isMock).toBe(false);
    });

    it("detects mock responses via mock field", async () => {
      const rawResponse = {
        status: "success",
        answer: "This is a mock response",
        metadata: {},
        mock: true,
      };
      mockPost.mockResolvedValueOnce({ data: rawResponse });

      const { aiApi } = await import("./ai");
      const result = await aiApi.query({ prompt: "test" });

      expect(result.isMock).toBe(true);
    });

    it("detects mock responses via metadata.mock", async () => {
      const rawResponse = {
        status: "success",
        answer: "This is a metadata-backed mock response",
        metadata: { mock: true },
      };
      mockPost.mockResolvedValueOnce({ data: rawResponse });

      const { aiApi } = await import("./ai");
      const result = await aiApi.query({ prompt: "test" });

      expect(result.isMock).toBe(true);
    });

    it("defaults include_context to true when not specified", async () => {
      mockPost.mockResolvedValueOnce({
        data: { status: "success", answer: "ok", metadata: {} },
      });

      const { aiApi } = await import("./ai");
      await aiApi.query({ prompt: "test" });

      expect(mockPost).toHaveBeenCalledWith("/ai/query/", {
        prompt: "test",
        include_context: true,
      });
    });
  });

  describe("aiApi.getDashboardSummary", () => {
    it("fetches and normalizes the dashboard summary", async () => {
      const rawResponse = {
        status: "success",
        answer: "Today shows 95% attendance with 2 pending leaves.",
        metadata: { snapshot_date: "2026-04-06" },
      };
      mockGet.mockResolvedValueOnce({ data: rawResponse });

      const { aiApi } = await import("./ai");
      const result = await aiApi.getDashboardSummary();

      expect(mockGet).toHaveBeenCalledWith("/ai/dashboard-summary/");
      expect(result.answer).toBe("Today shows 95% attendance with 2 pending leaves.");
      expect(result.metadata).toEqual({ snapshot_date: "2026-04-06" });
    });
  });

  describe("aiApi.getPolicies", () => {
    it("fetches and normalizes policy documents", async () => {
      const rawPolicies = [
        {
          id: 1,
          title: "Attendance Policy",
          category: "attendance",
          content: "Employees must check in by 9 AM.",
          version: "2.0.0",
          last_updated: "2026-03-15T10:00:00Z",
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          id: 2,
          title: "Leave Policy",
          category: "leaves",
          content: "Annual leave is 21 days.",
          version: "1.5.0",
          last_updated: "2026-02-20T08:00:00Z",
          created_at: "2025-01-01T00:00:00Z",
        },
      ];
      mockGet.mockResolvedValueOnce({ data: rawPolicies });

      const { aiApi } = await import("./ai");
      const result = await aiApi.getPolicies();

      expect(mockGet).toHaveBeenCalledWith("/ai/policies/");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "1",
        title: "Attendance Policy",
        category: "attendance",
        content: "Employees must check in by 9 AM.",
        version: "2.0.0",
        lastUpdated: "2026-03-15T10:00:00Z",
        createdAt: "2025-01-01T00:00:00Z",
      });
      expect(result[1].category).toBe("leaves");
    });

    it("handles empty or malformed policies response", async () => {
      mockGet.mockResolvedValueOnce({ data: null });

      const { aiApi } = await import("./ai");
      const result = await aiApi.getPolicies();

      expect(result).toEqual([]);
    });
  });
});

describe("AI Normalizers", () => {
  it("normalizeAIResponse handles missing fields gracefully", () => {
    const result = normalizeAIResponse({});
    expect(result.status).toBe("success");
    expect(result.answer).toBe("");
    expect(result.metadata).toEqual({});
    expect(result.isMock).toBe(false);
  });

  it("normalizeAIResponse reads mock from metadata", () => {
    const result = normalizeAIResponse({
      answer: "Mocked",
      metadata: { mock: true },
    });
    expect(result.isMock).toBe(true);
  });

  it("normalizePolicyDocument converts snake_case to camelCase", () => {
    const result = normalizePolicyDocument({
      id: 5,
      title: "Test Policy",
      category: "conduct",
      content: "Be nice.",
      version: "1.0.0",
      last_updated: "2026-04-01T00:00:00Z",
      created_at: "2025-06-01T00:00:00Z",
    });
    expect(result.id).toBe("5");
    expect(result.lastUpdated).toBe("2026-04-01T00:00:00Z");
    expect(result.createdAt).toBe("2025-06-01T00:00:00Z");
    expect(result.category).toBe("conduct");
  });
});
