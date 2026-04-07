import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Reports from "./Reports";
import { useReportAI } from "../hooks/useReportAI";
import { useReportGeneration } from "../hooks/useReportGeneration";
import { useDepartmentsQuery } from "@/features/structure/hooks/useDepartments";
import { useJobTitlesQuery } from "@/features/job-titles/hooks/useJobTitles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock the hooks
vi.mock("../hooks/useReportAI");
vi.mock("../hooks/useReportGeneration");
vi.mock("@/features/structure/hooks/useDepartments");
vi.mock("@/features/job-titles/hooks/useJobTitles");

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

// Mock Lucide icons to avoid rendering issues in tests
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
    Sparkles: () => <div data-testid="sparkles-icon" />,
    Loader2: () => <div data-testid="loader-icon" />,
    X: () => <div data-testid="close-icon" />,
    AlertCircle: () => <div data-testid="alert-icon" />,
    RefreshCw: () => <div data-testid="refresh-icon" />,
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe("Reports Page - AI Integration", () => {
  const mockGenerateReport = vi.fn();
  const mockAnalyzeReport = vi.fn();
  const mockExportToPdf = vi.fn();
  const mockExportToCsv = vi.fn();
  const mockExportToExcel = vi.fn();

  const mockUseReportAI = vi.mocked(useReportAI);
  const mockUseReportGeneration = vi.mocked(useReportGeneration);
  const mockUseDepartmentsQuery = vi.mocked(useDepartmentsQuery);
  const mockUseJobTitlesQuery = vi.mocked(useJobTitlesQuery);

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseReportGeneration.mockReturnValue({
      data: [{ id: 1, date: "2026-04-01" }],
      loading: false,
      generateReport: mockGenerateReport,
      exportToPdf: mockExportToPdf,
      exportToCsv: mockExportToCsv,
      exportToExcel: mockExportToExcel,
    });

    mockUseDepartmentsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useDepartmentsQuery>);

    mockUseJobTitlesQuery.mockReturnValue({
      data: { results: [] },
      isLoading: false,
    } as ReturnType<typeof useJobTitlesQuery>);
  });

  it("does not show AI analyze button when AI is disabled", () => {
    mockUseReportAI.mockReturnValue({
      isAnalyzing: false,
      aiAnalysis: null,
      analyzeReport: mockAnalyzeReport,
      setAiAnalysis: vi.fn(),
      isEnabled: false,
    });

    render(<Reports />, { wrapper: createWrapper() });
    
    expect(screen.queryByTitle("ai_analyze_button_title")).toBeNull();
  });

  it("shows AI analyze button when AI is enabled", () => {
    mockUseReportAI.mockReturnValue({
      isAnalyzing: false,
      aiAnalysis: null,
      analyzeReport: mockAnalyzeReport,
      setAiAnalysis: vi.fn(),
      isEnabled: true,
    });

    render(<Reports />, { wrapper: createWrapper() });
    
    expect(screen.getByTitle("ai_analyze_button_title")).toBeDefined();
  });

  it("calls analyzeReport when AI button is clicked", async () => {
    mockUseReportAI.mockReturnValue({
      isAnalyzing: false,
      aiAnalysis: null,
      analyzeReport: mockAnalyzeReport,
      setAiAnalysis: vi.fn(),
      isEnabled: true,
    });

    render(<Reports />, { wrapper: createWrapper() });
    
    const aiButton = screen.getByTitle("ai_analyze_button_title");
    fireEvent.click(aiButton);

    expect(mockAnalyzeReport).toHaveBeenCalledWith("attendance", expect.any(Array));
  });

  it("displays AI insights panel when analysis is available", () => {
    mockUseReportAI.mockReturnValue({
      isAnalyzing: false,
      aiAnalysis: "AI insights generated for the report.",
      analyzeReport: mockAnalyzeReport,
      setAiAnalysis: vi.fn(),
      isEnabled: true,
    });

    render(<Reports />, { wrapper: createWrapper() });
    
    expect(screen.getByText("ai_report_insights_title")).toBeDefined();
    expect(screen.getByText("AI insights generated for the report.")).toBeDefined();
  });

  it("shows loading spinner on AI button during analysis", () => {
    mockUseReportAI.mockReturnValue({
      isAnalyzing: true,
      aiAnalysis: null,
      analyzeReport: mockAnalyzeReport,
      setAiAnalysis: vi.fn(),
      isEnabled: true,
    });

    render(<Reports />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId("loader-icon")).toBeDefined();
    expect(screen.getByTitle("ai_analyze_button_title")).toBeDisabled();
  });
});
