# AI Readiness Guide: HR Companion

This document provides specialized instructions for AI Agents (including LLM-based assistants) to ensure safe, idiomatic, and effective interaction with the HR Companion codebase.

## 1. Project Navigation Map

| Directory Path | Core Responsibility |
| :--- | :--- |
| `backend/apps/` | **Modular Business Logic**. Domain-specific Django apps. |
| `backend/config/` | System-wide configuration (Django, Celery, Redis). |
| `backend/shared/` | Shared utilities, mixins, base views, and logging. |
| `backend/scripts/` | Automation and CI/CD maintenance scripts. |
| `frontend/src/` | React/Vite/Shadcn-UI application. |

---

## 2. AI-Safe Development Patterns

### Rule 1: The Service Layer is Sacred
When implementing logic, AI agents SHOULD use or create **Service classes** (e.g., `AttendanceService`).
- **DO NOT** put complex logic in `views.py` or `models.py`.
- **Reasoning**: This ensures business rules are isolated, reusable (API vs. Tasks), and easily testable.

### Rule 2: Explicit Contracts
Always ensure that API responses are handled by dedicated **Serializers**.
- **DO NOT** return raw Python dictionaries.
- **Reasoning**: To maintain type safety, the frontend generates TypeScript interfaces directly from the OpenAPI schema defined by these serializers.

---

## 3. Safe Access Guidelines

### Data Manipulation
- **READ**: AI agents MUST query the **Analytical Store** (database alias `analytical`) for all reports, KPIs, and aggregations.
- **WRITE**: AI agents SHOULD NOT perform bulk direct database updates via ORM if a Service exists for that action. Direct writes to `Attendance` or `Employee` bypass audit logs and business rules.

### Migration Safety
When an AI agent proposes a model change:
1.  Run `makemigrations` and inspect the result for circular dependencies.
2.  Be aware that infrastructure concerns reside in `backend/shared/`; do not add domain models to shared directories.

---

## 4. Operational Checklist for AI

- [ ] **Check Service First**: Before adding logic, search for `services/*.py` to see if a handler already exists.
- [ ] **Schema Refresh**: After modifying any API `Serializer`, run `python manage.py spectacular --file schema.yml` to refresh the contract.
- [ ] **Analytical Sync**: When adding new metrics, ensure they are added to the ETL pipeline in `apps.reports.services.analytical_service`.
- [ ] **Audit Trail**: Ensure that any new model changes include standard `created_at` and `updated_at` fields for lifecycle tracking.
