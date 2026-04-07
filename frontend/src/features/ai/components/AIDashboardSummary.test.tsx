import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIDashboardSummary } from "./AIDashboardSummary";
import { aiApi } from "../api/ai";

// Mock the AI API
vi.mock("../api/ai", () => ({
  aiApi: {
    getDashboardSummary: vi.fn(),
  },
}));

// Mock react-i18next
const t = (key: string, fallback?: string) => fallback || key;
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: t,
    i18n: { language: "en" },
  }),
}));

describe("AIDashboardSummary Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", async () => {
    vi.mocked(aiApi.getDashboardSummary).mockReturnValue(new Promise(() => {}));
    render(<AIDashboardSummary />);
    
    expect(screen.getByTestId("ai-summary-loading")).toBeDefined();
    expect(screen.getByText("Analyzing system health...")).toBeDefined();
  });

  it("renders summary content upon successful fetch", async () => {
    const mockResponse = {
      answer: "The system is performing optimally.",
      isMock: false,
    };
    vi.mocked(aiApi.getDashboardSummary).mockResolvedValue(mockResponse);

    render(<AIDashboardSummary />);

    await waitFor(() => {
      expect(screen.queryByTestId("ai-summary-loading")).toBeNull();
    });

    expect(screen.getByTestId("ai-summary-content")).toHaveTextContent(
      /"The system is performing optimally."/
    );
  });

  it("renders error state when fetch fails", async () => {
    vi.mocked(aiApi.getDashboardSummary).mockRejectedValue(new Error("API Error"));

    render(<AIDashboardSummary />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-summary-error")).toBeDefined();
    }, { timeout: 2000 });

    expect(screen.getByText("Could not generate AI insights at this time.")).toBeDefined();
  });

  it("displays demo badge when response is mock", async () => {
    const mockResponse = {
      answer: "This is a demo summary.",
      isMock: true,
    };
    vi.mocked(aiApi.getDashboardSummary).mockResolvedValue(mockResponse);

    render(<AIDashboardSummary />);

    await waitFor(() => {
      expect(screen.getByTestId("ai-summary-demo-badge")).toBeDefined();
    });
  });
});
