import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAIStatus } from "./useAIStatus";
import { getSettings } from "@/features/settings/api/settings";
import React from "react";

// Mock the settings API
vi.mock("@/features/settings/api/settings", () => ({
  getSettings: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useAIStatus Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isAIEnabled true when settings show ai_enabled", async () => {
    vi.mocked(getSettings).mockResolvedValue({ ai_enabled: true });

    const { result } = renderHook(() => useAIStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAIEnabled).toBe(true);
  });

  it("returns isAIEnabled false when settings show ai_enabled as false", async () => {
    vi.mocked(getSettings).mockResolvedValue({ ai_enabled: false });

    const { result } = renderHook(() => useAIStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAIEnabled).toBe(false);
  });

  it("returns isError true and isAIEnabled false when API fails", async () => {
    vi.mocked(getSettings).mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() => useAIStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(result.current.isAIEnabled).toBe(false);
  });
});
