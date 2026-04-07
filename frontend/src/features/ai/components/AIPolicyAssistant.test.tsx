import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIPolicyAssistant } from "./AIPolicyAssistant";
import { aiApi } from "../api/ai";
import type { AIResponse } from "../types";

// Mock the AI API
vi.mock("../api/ai", () => ({
  aiApi: {
    query: vi.fn(),
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

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("AIPolicyAssistant Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders welcome message initially", () => {
    render(<AIPolicyAssistant />);
    expect(screen.getByText("HR Policy Assistant")).toBeDefined();
    expect(screen.getByText(/Hello! I'm your HR AI Assistant/)).toBeDefined();
  });

  it("handles user query and displays AI response", async () => {
    const mockResponse: AIResponse = {
      answer: "The leave policy allows 21 days of annual leave.",
      metadata: {},
      status: "success",
    };
    vi.mocked(aiApi.query).mockResolvedValue(mockResponse);

    render(<AIPolicyAssistant />);

    const input = screen.getByTestId("chat-input");
    const submit = screen.getByTestId("chat-submit");

    fireEvent.change(input, { target: { value: "How many leave days?" } });
    fireEvent.click(submit);

    // Initial message from user
    expect(screen.getByText("How many leave days?")).toBeDefined();

    await waitFor(() => {
      expect(screen.queryByTestId("chat-loading")).toBeNull();
    });

    expect(screen.getByText("The leave policy allows 21 days of annual leave.")).toBeDefined();
    expect(aiApi.query).toHaveBeenCalledWith({
      prompt: "How many leave days?",
      includeContext: true,
    });
  });

  it("handles API error gracefully", async () => {
    vi.mocked(aiApi.query).mockRejectedValue(new Error("AI error"));

    render(<AIPolicyAssistant />);

    const input = screen.getByTestId("chat-input");
    const submit = screen.getByTestId("chat-submit");

    fireEvent.change(input, { target: { value: "error test" } });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.queryByTestId("chat-loading")).toBeNull();
    });

    expect(screen.getByText(/I encountered an error while processing your request/)).toBeDefined();
  });

  it("disables input and submit while loading", async () => {
    vi.mocked(aiApi.query).mockReturnValue(new Promise(() => {})); // Never resolves

    render(<AIPolicyAssistant />);

    const input = screen.getByTestId("chat-input");
    const submit = screen.getByTestId("chat-submit");

    fireEvent.change(input, { target: { value: "loading test" } });
    fireEvent.click(submit);

    expect(input).toBeDisabled();
    expect(submit).toBeDisabled();
  });

  it("retries the last user message after an AI error", async () => {
    const retryResponse: AIResponse = {
      answer: "Retry succeeded.",
      metadata: {},
      status: "success",
    };

    vi.mocked(aiApi.query)
      .mockRejectedValueOnce(new Error("AI error"))
      .mockResolvedValueOnce(retryResponse);

    render(<AIPolicyAssistant />);

    fireEvent.change(screen.getByTestId("chat-input"), {
      target: { value: "retry test" },
    });
    fireEvent.click(screen.getByTestId("chat-submit"));

    await waitFor(() => {
      expect(screen.queryByTestId("chat-loading")).toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByText("Retry succeeded.")).toBeDefined();
    });

    expect(aiApi.query).toHaveBeenNthCalledWith(1, {
      prompt: "retry test",
      includeContext: true,
    });
    expect(aiApi.query).toHaveBeenNthCalledWith(2, {
      prompt: "retry test",
      includeContext: true,
    });
  });
});
