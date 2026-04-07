import type { ApiUser } from "@/types/contracts";
import type { User } from "@/features/users/types";
import {
  asRecord,
  toOptionalBoolean,
  toOptionalString,
  toOptionalStringArray,
  toRequiredString,
  type UnknownRecord,
} from "./base";

const getNameFromUser = (record: UnknownRecord) => {
  const directName = toOptionalString(record.name);
  if (directName) return directName;

  const firstName = toOptionalString(record.first_name ?? record.firstName);
  const lastName = toOptionalString(record.last_name ?? record.lastName);
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  return toRequiredString(record.username, "Unknown User");
};

export function normalizeUser(raw: ApiUser | User | Record<string, unknown>): User {
  const record = asRecord(raw);
  return {
    id: toRequiredString(record.id),
    name: getNameFromUser(record),
    username: toOptionalString(record.username),
    role: (toRequiredString(record.role, "employee") as User["role"]),
    email: toOptionalString(record.email),
    is_active: toOptionalBoolean(record.is_active),
    last_login: toOptionalString(record.last_login),
    must_change_password: toOptionalBoolean(record.must_change_password),
    mfa_enabled: toOptionalBoolean(record.mfa_enabled ?? record.mfaEnabled),
    permissions: toOptionalStringArray(record.permissions) ?? [],
    role_permissions:
      toOptionalStringArray(record.role_permissions ?? record.rolePermissions) ?? [],
    effective_permissions:
      toOptionalStringArray(record.effective_permissions ?? record.effectivePermissions) ?? [],
    avatar: toOptionalString(record.avatar),
  };
}
