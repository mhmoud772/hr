import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "@/features/auth/components/AuthProvider";
import type { User } from "@/types/api";
import { usePermissions } from "./usePermissions";

vi.mock("@/features/auth/components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

const buildAuthContext = (userOverrides: Partial<User>): ReturnType<typeof useAuth> => ({
  user: {
    id: "user-1",
    name: "Test User",
    role: "employee",
    permissions: [],
    ...userOverrides,
  },
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(async () => {}),
  refreshUser: vi.fn(async () => null),
});

describe("usePermissions Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true for superuser", () => {
    vi.mocked(useAuth).mockReturnValue(
      buildAuthContext({ role: "admin", permissions: [] }),
    );

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasPermission("any.perm")).toBe(true);
  });

  it("checks specific permission", () => {
    vi.mocked(useAuth).mockReturnValue(
      buildAuthContext({ role: "employee", permissions: ["core.view_employee"] }),
    );

    const { result } = renderHook(() => usePermissions());
    expect(result.current.hasPermission("core.view_employee")).toBe(true);
    expect(result.current.hasPermission("core.delete_employee")).toBe(false);
  });
});
