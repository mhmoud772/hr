import { describe, it, expect, vi, beforeEach } from "vitest";

const { requestUse, responseUse, create } = vi.hoisted(() => {
  const requestUse = vi.fn();
  const responseUse = vi.fn();
  const create = vi.fn(() => ({
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
  }));

  return { requestUse, responseUse, create };
});

// Mock axios
vi.mock("axios", () => {
  return {
    default: {
      create,
    },
  };
});

describe("API Client Interceptors", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("configures interceptors during client initialization", async () => {
    const { apiClient, publicApiClient } = await import("./api-client");

    expect(apiClient).toBeDefined();
    expect(publicApiClient).toBeDefined();
    expect(create).toHaveBeenCalledTimes(2);
    expect(requestUse).toHaveBeenCalledTimes(1);
    expect(responseUse).toHaveBeenCalledTimes(2);
  }, 15000);
});
