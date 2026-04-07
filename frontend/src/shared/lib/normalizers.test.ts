import { describe, expect, it } from "vitest";
import { normalizePaginatedList } from "./normalizers/base";
import { normalizeUser } from "./normalizers/users";
import {
  normalizeEmployee,
  normalizeDepartment,
  normalizeJobTitle,
} from "./normalizers/employees";
import {
  normalizeAttendance,
  normalizeShift,
  normalizeEmployeeShift,
} from "./normalizers/attendance";
import { normalizeDevice } from "./normalizers/devices";
import {
  normalizeDashboardSummary,
  normalizeDashboardPulse,
} from "./normalizers/reports";

import {
  normalizeAuditLog,
  normalizeAsset,
  normalizeNotification,
  normalizePayrollRecord,
  normalizeTrainingRecord,
} from "./normalizers/features";

describe("normalizers", () => {
  it("normalizes users with string-based permission payloads", () => {
    const user = normalizeUser({
      id: 7,
      username: "admin",
      first_name: "Ada",
      last_name: "Lovelace",
      role: "admin",
      role_permissions: '["employees.read","employees.write"]',
      effective_permissions: "reports.read,settings.write",
    });

    expect(user).toMatchObject({
      id: "7",
      name: "Ada Lovelace",
      username: "admin",
      role: "admin",
      role_permissions: ["employees.read", "employees.write"],
      effective_permissions: ["reports.read", "settings.write"],
    });
  });

  it("normalizes employee contract fields into frontend shape", () => {
    const employee = normalizeEmployee({
      id: 15,
      employee_code: "EMP-0015",
      name: "Noura",
      email: "noura@example.com",
      department_name: "HR",
      job_title_name: "Manager",
      hire_date: "2026-01-01",
      salary: "4500.50",
      contract_status: "permanent",
      avatar: "/media/avatar.png",
    });

    expect(employee).toMatchObject({
      id: "15",
      employeeCode: "EMP-0015",
      department: "HR",
      jobTitle: "Manager",
      hireDate: "2026-01-01",
      salary: 4500.5,
      contractStatus: "permanent",
      avatarUrl: "/media/avatar.png",
    });
  });

  it("normalizes attendance and keeps employee relation id", () => {
    const attendance = normalizeAttendance({
      id: "att-1",
      employee: 15,
      employee_code: "EMP-0015",
      employee_name: "Noura",
      date: "2026-04-05",
      status: "present",
      check_in: "08:00:00",
      check_out: "17:00:00",
    });

    expect(attendance).toMatchObject({
      id: "att-1",
      employeeId: "15",
      employeeCode: "EMP-0015",
      employeeName: "Noura",
      checkIn: "08:00:00",
      checkOut: "17:00:00",
    });
  });

  it("normalizes departments, devices, and paginated payloads", () => {
    const department = normalizeDepartment({
      id: 4,
      name: "Operations",
      parent: 1,
      manager: 22,
      manager_name: "Salem",
      employee_count: 12,
      sort_order: 3,
    });
    const device = normalizeDevice({
      id: "dev-1",
      name: "Front Gate",
      serialNumber: "SN-1",
      ipAddress: "192.168.1.10",
      location: "HQ",
      firmware_version: "1.0.5",
      isPrimaryEnrollment: true,
    });
    const paged = normalizePaginatedList(
      { count: 1, results: [{ id: 1, name: "IT" }] },
      normalizeDepartment,
    );

    expect(department).toMatchObject({
      id: "4",
      parentId: "1",
      managerId: "22",
      managerName: "Salem",
      employeeCount: 12,
      sortOrder: 3,
    });
    expect(device).toMatchObject({
      firmwareVersion: "1.0.5",
      primaryEnrollment: true,
    });
    expect(paged).toEqual({
      count: 1,
      results: [{ id: "1", name: "IT", parentId: null, managerId: null, managerName: undefined, employeeCount: undefined, sortOrder: undefined }],
    });
  });

  it("normalizes notifications and employee-linked records with display metadata", () => {
    const notification = normalizeNotification({
      id: 5,
      title: "Sync completed",
      body: "Device sync finished successfully",
      status: "sent",
      created_at: "2026-04-05T10:15:00Z",
    });
    const payroll = normalizePayrollRecord({
      id: 22,
      employee: 15,
      employee_code: "EMP-0015",
      employee_name: "Noura",
      period_start: "2026-04-01",
      period_end: "2026-04-30",
      net_salary: "5200.00",
      status: "approved",
    });
    const training = normalizeTrainingRecord({
      id: 9,
      employee: 15,
      employee_code: "EMP-0015",
      employee_name: "Noura",
      title: "Safety Training",
      status: "completed",
    });

    expect(notification).toMatchObject({
      description: "Device sync finished successfully",
      read: true,
      type: "success",
      createdAt: "2026-04-05T10:15:00Z",
    });
    expect(payroll).toMatchObject({
      employeeId: "15",
      employeeCode: "EMP-0015",
      employeeName: "Noura",
      net_salary: 5200,
    });
    expect(training).toMatchObject({
      employeeId: "15",
      employeeCode: "EMP-0015",
      employeeName: "Noura",
    });
  });

  it("normalizes assets with assigned employee display fields", () => {
    const asset = normalizeAsset({
      id: 4,
      name: "Laptop",
      assigned_to: 15,
      assigned_to_code: "EMP-0015",
      assigned_to_name: "Noura",
      status: "assigned",
    });

    expect(asset).toMatchObject({
      assignedTo: "15",
      assignedToCode: "EMP-0015",
      assignedToName: "Noura",
      status: "assigned",
    });
  });

  it("normalizes job titles, audit logs, shifts, and employee shifts", () => {
    const jobTitle = normalizeJobTitle({
      id: 3,
      name: "HR Manager",
      name_en: "HR Manager",
      department: 4,
      department_name: "HR",
      level: "manager",
      min_salary: "4000",
      max_salary: "7000",
    });
    const auditLog = normalizeAuditLog({
      id: 10,
      user: 7,
      user_name: "admin",
      action: "update",
      model_name: "Settings",
      object_id: "1",
      created_at: "2026-04-05T11:00:00Z",
    });
    const shift = normalizeShift({
      id: 2,
      name: "Morning",
      start_time: "08:00:00",
      end_time: "16:00:00",
    });
    const employeeShift = normalizeEmployeeShift({
      id: 9,
      employee: 15,
      employee_name: "Noura",
      employee_code: "EMP-0015",
      shift: 2,
      shift_name: "Morning",
      start_date: "2026-04-01",
    });

    expect(jobTitle).toMatchObject({
      id: "3",
      department: "HR",
      departmentId: "4",
      minSalary: 4000,
      maxSalary: 7000,
    });
    expect(auditLog).toMatchObject({
      user: "7",
      userName: "admin",
      action: "update",
    });
    expect(shift).toMatchObject({
      id: "2",
      name: "Morning",
    });
    expect(employeeShift).toMatchObject({
      employeeId: "15",
      employeeCode: "EMP-0015",
      employeeName: "Noura",
      shift: "2",
      shiftName: "Morning",
    });
  });

  it("normalizes dashboard payloads", () => {
    const summary = normalizeDashboardSummary({
      totalEmployees: 20,
      presentToday: 16,
      pendingLeaves: 2,
      departmentStats: [{ name: "HR", value: 5 }],
      activityFeed: [{ id: 1, name: "Noura", action: "Checked in", time: "now", type: "attendance" }],
      attendanceStats: [{ day: "2026-04-05", present: 16, absent: 4 }],
    });
    const pulse = normalizeDashboardPulse({
      currentlyCheckedIn: 7,
      deviceStatus: { online: 2, total: 3 },
      latestLogs: [{ employee_code: "EMP-0015", device: "Gate", timestamp: "2026-04-05T11:00:00Z", action: "check_in" }],
      lastSync: "2026-04-05T10:55:00Z",
    });

    expect(summary).toMatchObject({
      totalEmployees: 20,
      absentToday: 4,
      departmentDistribution: [{ name: "HR", value: 5 }],
      recentActivities: [{ id: "1", name: "Noura", type: "attendance" }],
    });
    expect(pulse).toMatchObject({
      currentlyCheckedIn: 7,
      deviceStatus: { online: 2, total: 3 },
      latestLogs: [{ employee_code: "EMP-0015", device: "Gate" }],
      lastSync: "2026-04-05T10:55:00Z",
    });
  });
});
