from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.employees.models import (
    Asset,
    Department,
    Employee,
    EmployeeDocument,
    JobTitle,
    Leave,
    PerformanceReview,
    RecruitmentCandidate,
    TrainingRecord,
)

User = get_user_model()


def _results(payload):
    if isinstance(payload, dict) and "results" in payload:
        return payload["results"]
    return payload


class EmployeesFreeTextBilingualAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="employees_free_text_admin",
            password="Admin12345!",
            role="system_admin",
            email="employees-free-text-admin@example.com",
        )
        self.client.force_authenticate(user=self.admin)

        self.department = Department.objects.create(name="\u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629", name_en="Human Resources")
        self.job_title = JobTitle.objects.create(
            name="\u0623\u062e\u0635\u0627\u0626\u064a \u0645\u0648\u0627\u0631\u062f \u0628\u0634\u0631\u064a\u0629",
            name_en="HR Specialist",
            department=self.department,
            level="mid",
        )
        self.employee = Employee.objects.create(
            name="\u0645\u0646\u0649 \u0639\u0644\u064a",
            employee_code="EMP-FREE-001",
            email="mona.free@example.com",
            department=self.department,
            job_title=self.job_title,
            status="active",
        )
        self.leave = Leave.objects.create(
            employee=self.employee,
            leave_type="annual",
            start_date="2026-04-10",
            end_date="2026-04-12",
            days=3,
            reason="\u0638\u0631\u0648\u0641 \u0639\u0627\u0626\u0644\u064a\u0629",
            reason_en="Family commitments",
            status="pending",
        )
        self.review = PerformanceReview.objects.create(
            employee=self.employee,
            period="2025",
            rating=4,
            reviewer=self.admin,
            notes="\u064a\u0642\u062f\u0645 \u0623\u062f\u0627\u0621 \u0645\u0633\u062a\u0642\u0631.",
            notes_en="Consistently delivers reliable work.",
        )
        self.asset = Asset.objects.create(
            name="\u062d\u0627\u0633\u0628 \u0645\u062d\u0645\u0648\u0644",
            name_en="Laptop",
            serial_number="AST-FREE-001",
            category="\u0645\u0639\u062f\u0627\u062a \u062a\u0642\u0646\u064a\u0629",
            category_en="IT Equipment",
            status="assigned",
            assigned_to=self.employee,
            notes="\u0645\u062e\u0635\u0635 \u0644\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u064a\u0648\u0645\u064a.",
            notes_en="Assigned for daily operations.",
        )
        self.training = TrainingRecord.objects.create(
            employee=self.employee,
            title="\u0623\u0633\u0627\u0633\u064a\u0627\u062a \u0627\u0644\u0642\u064a\u0627\u062f\u0629",
            title_en="Leadership Essentials",
            provider="\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062f \u0627\u0644\u0628\u0634\u0631\u064a\u0629",
            provider_en="HR Academy",
            status="planned",
            notes="\u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0648\u062d\u062f\u0629 \u0627\u0644\u062a\u062f\u0631\u064a\u0628\u064a\u0629.",
            notes_en="Completed the first training module.",
        )
        self.candidate = RecruitmentCandidate.objects.create(
            name="\u0633\u0627\u0631\u0629 \u0625\u0628\u0631\u0627\u0647\u064a\u0645",
            email="sara.free@example.com",
            phone="+966500000099",
            position="\u0645\u062d\u0644\u0644 \u0628\u064a\u0627\u0646\u0627\u062a",
            position_en="Data Analyst",
            source="\u0644\u064a\u0646\u0643\u062f\u0625\u0646",
            source_en="LinkedIn",
            status="applied",
            notes="\u062a\u0645 \u062a\u0631\u0634\u064a\u062d\u0647\u0627 \u0628\u0639\u062f \u0627\u0644\u0641\u0631\u0632 \u0648\u0627\u0644\u0645\u0642\u0627\u0628\u0644\u0629.",
            notes_en="Shortlisted after screening and first interview.",
        )
        self.document = EmployeeDocument.objects.create(
            employee=self.employee,
            title="\u0639\u0642\u062f \u0627\u0644\u0639\u0645\u0644",
            title_en="Employment Contract",
            doc_type="\u0639\u0642\u062f",
            doc_type_en="Contract",
            notes="\u0646\u0633\u062e\u0629 \u0645\u0648\u0642\u0639\u0629 \u0645\u0646 \u0639\u0642\u062f \u0627\u0644\u0639\u0645\u0644.",
            notes_en="Signed copy of the employment contract.",
            file=SimpleUploadedFile("contract.txt", b"demo contract"),
            uploaded_by=self.admin,
        )

    def test_employee_related_free_text_returns_localized_english_fields(self):
        leaves_response = self.client.get("/api/leaves/", HTTP_ACCEPT_LANGUAGE="en")
        reviews_response = self.client.get("/api/performance/", HTTP_ACCEPT_LANGUAGE="en")
        training_response = self.client.get("/api/training/", HTTP_ACCEPT_LANGUAGE="en")
        assets_response = self.client.get("/api/assets/", HTTP_ACCEPT_LANGUAGE="en")
        recruitment_response = self.client.get("/api/recruitment/", HTTP_ACCEPT_LANGUAGE="en")
        documents_response = self.client.get("/api/documents/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(leaves_response.status_code, status.HTTP_200_OK)
        self.assertEqual(reviews_response.status_code, status.HTTP_200_OK)
        self.assertEqual(training_response.status_code, status.HTTP_200_OK)
        self.assertEqual(assets_response.status_code, status.HTTP_200_OK)
        self.assertEqual(recruitment_response.status_code, status.HTTP_200_OK)
        self.assertEqual(documents_response.status_code, status.HTTP_200_OK)

        self.assertEqual(_results(leaves_response.data)[0]["reason"], "Family commitments")
        self.assertEqual(_results(reviews_response.data)[0]["notes"], "Consistently delivers reliable work.")
        self.assertEqual(_results(training_response.data)[0]["notes"], "Completed the first training module.")
        self.assertEqual(_results(assets_response.data)[0]["notes"], "Assigned for daily operations.")
        self.assertEqual(_results(recruitment_response.data)[0]["notes"], "Shortlisted after screening and first interview.")
        self.assertEqual(_results(documents_response.data)[0]["notes"], "Signed copy of the employment contract.")
