const fs = require("fs");
const { chromium } = require("playwright");

const FRONTEND_URL = process.env.TARGET_URL || "http://localhost:8080";
const API_BASE = process.env.API_URL || "http://localhost:8000/api";

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 12);
const today = new Date().toISOString().slice(0, 10);
const plusDays = (days) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const runOffset = (Number(stamp.slice(-2)) % 20) + 1;

const data = {
  department: `Dept-${stamp}`,
  jobTitle: `Engineer-${stamp}`,
  employeeId: "employee02579",
  employeeName: "Employee 02579",
  employeeEmail: "employee02579@example.com",
  employeePhone: "0500000001",
  attendanceDate: plusDays(runOffset),
  leaveStart: plusDays(7 + runOffset),
  leaveEnd: plusDays(8 + runOffset),
  periodStart: today,
  periodEnd: plusDays(30),
  candidateName: `Candidate ${stamp}`,
  candidateEmail: `candidate${stamp}@example.com`,
  reviewPeriod: `${new Date().getFullYear()}-Q1`,
  trainingTitle: `React Bootcamp ${stamp}`,
  assetName: `Laptop-${stamp}`,
  assetSerial: `SN-${stamp}`,
  newUsername: `user${stamp}`,
  newUserEmail: `user${stamp}@example.com`,
};

const results = [];
const artifacts = [];
const startedAt = new Date().toISOString();

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const addResult = (name, status, details = {}) => {
  results.push({ name, status, ...details });
};

const screenshot = async (page, name) => {
  const path = `C:\\tmp\\deep-v2-${slugify(name)}.png`;
  await page.screenshot({ path, fullPage: true });
  artifacts.push(path);
};

const runStep = async (name, fn, page = null) => {
  try {
    await fn();
    addResult(name, "pass");
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    addResult(name, "fail", { error: message });
    if (page) {
      try {
        await screenshot(page, `error-${name}`);
      } catch {}
    }
  }
};

const parseResponseBody = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (res.status === 204) return null;
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const apiRequest = async (token, path, options = {}) => {
  const method = options.method || "GET";
  const expected = options.expected || [200, 201];
  const headers = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!expected.includes(response.status)) {
    const body = await parseResponseBody(response);
    throw new Error(
      `API ${method} ${path} failed (${response.status}): ${JSON.stringify(body).slice(0, 500)}`,
    );
  }

  return parseResponseBody(response);
};

const getList = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.results)) return value.results;
  return [];
};

const apiLogin = async (username, password) => {
  const payload = await apiRequest(null, "/auth/login", {
    method: "POST",
    body: { username, password },
    expected: [200],
  });
  const token = payload?.token || payload?.accessToken || payload?.access;
  if (!token) throw new Error("Missing token in login response");
  return token;
};

const upsertEmployeeUser = async (adminToken) => {
  const list = await apiRequest(adminToken, `/users/?search=${encodeURIComponent(data.employeeId)}`);
  const users = getList(list);
  const target = users.find((u) => String(u.username || "").toLowerCase() === data.employeeId.toLowerCase());

  const payload = {
    username: data.employeeId,
    email: data.employeeEmail,
    role: "employee",
    is_active: true,
    first_name: "Employee",
    last_name: "02579",
    must_change_password: false,
    password: "Employee12345!",
    permissions: [
      "self_service",
      "attendance",
      "leaves",
      "payroll",
      "assets",
      "training",
      "performance",
      "notifications",
      "employees",
      "reports",
    ],
  };

  if (target) {
    await apiRequest(adminToken, `/users/${target.id}/`, {
      method: "PATCH",
      body: payload,
      expected: [200],
    });
    return target.id;
  }

  const created = await apiRequest(adminToken, "/users/", {
    method: "POST",
    body: payload,
    expected: [201],
  });
  return created?.id;
};

const upsertEmployeeProfile = async (adminToken) => {
  const list = await apiRequest(adminToken, `/employees/?search=${encodeURIComponent(data.employeeId)}`);
  const employees = getList(list);
  const target = employees.find((e) => String(e.id || "").toLowerCase() === data.employeeId.toLowerCase());

  const payload = {
    id: data.employeeId,
    name: data.employeeName,
    email: data.employeeEmail,
    phone: data.employeePhone,
    department: data.department,
    jobTitle: data.jobTitle,
    hireDate: today,
    status: "active",
  };

  if (target) {
    await apiRequest(adminToken, `/employees/${encodeURIComponent(data.employeeId)}/`, {
      method: "PATCH",
      body: payload,
      expected: [200],
    });
    return;
  }

  await apiRequest(adminToken, "/employees/", {
    method: "POST",
    body: payload,
    expected: [201],
  });
};

const verifyTextOnPage = async (page, text) => {
  const count = await page.getByText(text, { exact: false }).count();
  if (count < 1) {
    throw new Error(`Expected text not found: ${text}`);
  }
};

const checkPage = async (page, path, title, expectedText) => {
  await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: "networkidle" });
  const currentPath = new URL(page.url()).pathname;
  if (currentPath !== path) {
    throw new Error(`Unexpected path. expected=${path} actual=${currentPath}`);
  }
  if (expectedText) {
    await verifyTextOnPage(page, expectedText);
  }
  await screenshot(page, `admin-${path.replace(/\//g, "-") || "root"}`);
};

(async () => {
  let adminToken = "";

  await runStep("API admin login", async () => {
    adminToken = await apiLogin("admin", "Admin12345!");
  });

  await runStep("API ensure employee user", async () => {
    await upsertEmployeeUser(adminToken);
  });

  await runStep("API create department", async () => {
    await apiRequest(adminToken, "/departments/", {
      method: "POST",
      body: { name: data.department, parentId: null, managerId: null, sortOrder: 1 },
      expected: [201],
    });
  });

  await runStep("API create job title", async () => {
    await apiRequest(adminToken, "/job-titles/", {
      method: "POST",
      body: {
        name: data.jobTitle,
        nameEn: data.jobTitle,
        department: data.department,
        level: "manager",
        minSalary: 8000,
        maxSalary: 12000,
        description: "Created by deep practical test",
      },
      expected: [201],
    });
  });

  await runStep("API upsert employee profile", async () => {
    await upsertEmployeeProfile(adminToken);
  });

  await runStep("API create attendance", async () => {
    await apiRequest(adminToken, "/attendance/", {
      method: "POST",
      body: {
        employeeId: data.employeeId,
        date: data.attendanceDate,
        status: "present",
        checkIn: "09:00",
        checkOut: "17:00",
      },
      expected: [201],
    });
  });

  await runStep("API create leave", async () => {
    await apiRequest(adminToken, "/leaves/", {
      method: "POST",
      body: {
        employeeId: data.employeeId,
        leaveType: "annual",
        startDate: data.leaveStart,
        endDate: data.leaveEnd,
        reason: "Created by deep practical test",
      },
      expected: [201],
    });
  });

  await runStep("API create payroll", async () => {
    await apiRequest(adminToken, "/payroll/", {
      method: "POST",
      body: {
        employeeId: data.employeeId,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        base_salary: 10000,
        allowances: 500,
        deductions: 200,
        status: "draft",
      },
      expected: [201],
    });
  });

  await runStep("API create recruitment candidate", async () => {
    await apiRequest(adminToken, "/recruitment/", {
      method: "POST",
      body: {
        name: data.candidateName,
        email: data.candidateEmail,
        phone: "0500000010",
        position: "QA Engineer",
        status: "applied",
        source: "LinkedIn",
        notes: "Created by deep practical test",
      },
      expected: [201],
    });
  });

  await runStep("API create performance review", async () => {
    await apiRequest(adminToken, "/performance/", {
      method: "POST",
      body: {
        employeeId: data.employeeId,
        period: data.reviewPeriod,
        rating: 4,
        notes: "Created by deep practical test",
      },
      expected: [201],
    });
  });

  await runStep("API create training record", async () => {
    await apiRequest(adminToken, "/training/", {
      method: "POST",
      body: {
        employeeId: data.employeeId,
        title: data.trainingTitle,
        provider: "Acme Training",
        start_date: data.leaveStart,
        end_date: data.leaveEnd,
        status: "planned",
        notes: "Created by deep practical test",
      },
      expected: [201],
    });
  });

  await runStep("API create asset", async () => {
    await apiRequest(adminToken, "/assets/", {
      method: "POST",
      body: {
        name: data.assetName,
        serial_number: data.assetSerial,
        category: "IT",
        status: "assigned",
        assignedTo: data.employeeId,
        notes: "Created by deep practical test",
      },
      expected: [201],
    });
  });

  await runStep("API create user", async () => {
    await apiRequest(adminToken, "/users/", {
      method: "POST",
      body: {
        username: data.newUsername,
        email: data.newUserEmail,
        role: "employee",
        is_active: true,
        first_name: "Test",
        last_name: `User${stamp}`,
        must_change_password: false,
        password: "User12345!",
        permissions: ["self_service"],
      },
      expected: [201],
    });
  });

  await runStep("API employee users permission denied", async () => {
    const employeeToken = await apiLogin(data.employeeId, "Employee12345!");
    const response = await fetch(`${API_BASE}/users/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    if (![401, 403].includes(response.status)) {
      const body = await parseResponseBody(response);
      throw new Error(`Expected 401/403, got ${response.status}: ${JSON.stringify(body).slice(0, 300)}`);
    }
  });

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "en");
  });

  await runStep(
    "UI admin login",
    async () => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle" });
      await page.getByLabel("Username").fill("admin");
      await page.getByLabel("Password").fill("Admin12345!");
      await page.getByRole("button", { name: /^Login$/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      await screenshot(page, "admin-dashboard");
    },
    page,
  );

  await runStep("UI page dashboard", async () => checkPage(page, "/", "Dashboard"), page);
  await runStep("UI page structure", async () => checkPage(page, "/structure", "Organization structure"), page);
  await runStep("UI page job-titles", async () => checkPage(page, "/job-titles", "Job Titles"), page);
  await runStep("UI page employees", async () => checkPage(page, "/employees", "Employees"), page);
  await runStep("UI page attendance", async () => checkPage(page, "/attendance", "Attendance"), page);
  await runStep("UI page leaves", async () => checkPage(page, "/leaves", "Leaves"), page);
  await runStep("UI page payroll", async () => checkPage(page, "/payroll", "Payroll"), page);
  await runStep("UI page recruitment", async () => checkPage(page, "/recruitment", "Recruitment"), page);
  await runStep("UI page performance", async () => checkPage(page, "/performance", "Performance"), page);
  await runStep("UI page training", async () => checkPage(page, "/training", "Training"), page);
  await runStep("UI page assets", async () => checkPage(page, "/assets", "Assets"), page);
  await runStep("UI page devices", async () => checkPage(page, "/devices", "Devices"), page);
  await runStep("UI page users", async () => checkPage(page, "/users", "Users"), page);
  await runStep("UI page settings", async () => checkPage(page, "/settings", "Settings"), page);
  await runStep("UI page reports", async () => checkPage(page, "/reports", "Reports"), page);
  await runStep("UI page self-service-admin", async () => checkPage(page, "/self-service", "Self Service"), page);

  await runStep(
    "UI employee login",
    async () => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle" });
      await page.getByLabel("Username").fill(data.employeeId);
      await page.getByLabel("Password").fill("Employee12345!");
      await page.getByRole("button", { name: /^Login$/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      await screenshot(page, "employee-dashboard");
    },
    page,
  );

  await runStep(
    "UI employee self-service",
    async () => {
      await checkPage(page, "/self-service", "Self Service");
    },
    page,
  );

  await runStep(
    "UI employee users forbidden",
    async () => {
      await page.goto(`${FRONTEND_URL}/users`, { waitUntil: "networkidle" });
      const isNotAuthorizedPath = /\/not-authorized/.test(page.url());
      if (!isNotAuthorizedPath) {
        await page.getByRole("heading", { name: /not authorized/i }).waitFor({ timeout: 10000 });
      }
      await screenshot(page, "employee-not-authorized");
    },
    page,
  );

  await browser.close();

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    frontend: FRONTEND_URL,
    api: API_BASE,
    data,
    results,
    artifacts,
  };

  fs.writeFileSync("C:\\tmp\\deep-test-report-v2.json", JSON.stringify(report, null, 2));

  const lines = [
    "# HR Companion Deep Practical Test Report (V2)",
    "",
    `Frontend: ${FRONTEND_URL}`,
    `API: ${API_BASE}`,
    `Started: ${report.startedAt}`,
    `Finished: ${report.finishedAt}`,
    "",
    "## Data Set",
    "```json",
    JSON.stringify(data, null, 2),
    "```",
    "",
    "## Results",
    ...results.map((r) => `- ${r.status.toUpperCase()}: ${r.name}${r.error ? ` (${r.error})` : ""}`),
    "",
    "## Artifacts",
    ...artifacts.map((a) => `- ${a}`),
    "",
  ];
  fs.writeFileSync("C:\\tmp\\deep-test-report-v2.md", lines.join("\n"));

  console.log(JSON.stringify(report, null, 2));
})();
