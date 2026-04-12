from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.employees.models import Asset, Department, Employee, JobTitle, RecruitmentCandidate, TrainingRecord

User = get_user_model()


def _results(payload):
    if isinstance(payload, dict) and "results" in payload:
        return payload["results"]
    return payload


class EmployeesBilingualAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="employees_admin",
            password="Admin12345!",
            role="system_admin",
            email="employees-admin@example.com",
        )
        self.client.force_authenticate(user=self.admin)

        self.department = Department.objects.create(name="الموارد البشرية", name_en="Human Resources")
        self.job_title = JobTitle.objects.create(
            name="أخصائي موارد بشرية",
            name_en="HR Specialist",
            department=self.department,
            level="mid",
        )
        self.employee = Employee.objects.create(
            name="منى علي",
            employee_code="EMP-BI-001",
            email="mona@example.com",
            department=self.department,
            job_title=self.job_title,
            status="active",
        )
        self.asset = Asset.objects.create(
            name="حاسب محمول 1",
            name_en="Laptop 1",
            serial_number="AST-BI-001",
            category="معدات تقنية",
            category_en="IT Equipment",
            assigned_to=self.employee,
            status="assigned",
        )
        self.training = TrainingRecord.objects.create(
            employee=self.employee,
            title="أساسيات القيادة",
            title_en="Leadership Essentials",
            provider="أكاديمية الموارد البشرية",
            provider_en="HR Academy",
            status="planned",
        )
        self.candidate = RecruitmentCandidate.objects.create(
            name="سارة إبراهيم",
            email="sara.bi@example.com",
            position="محلل بيانات",
            position_en="Data Analyst",
            source="لينكدإن",
            source_en="LinkedIn",
            status="applied",
        )

    def test_assets_training_and_recruitment_return_localized_english_fields(self):
        assets_response = self.client.get("/api/assets/", HTTP_ACCEPT_LANGUAGE="en")
        training_response = self.client.get("/api/training/", HTTP_ACCEPT_LANGUAGE="en")
        recruitment_response = self.client.get("/api/recruitment/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(assets_response.status_code, status.HTTP_200_OK)
        self.assertEqual(training_response.status_code, status.HTTP_200_OK)
        self.assertEqual(recruitment_response.status_code, status.HTTP_200_OK)

        asset_item = _results(assets_response.data)[0]
        training_item = _results(training_response.data)[0]
        recruitment_item = _results(recruitment_response.data)[0]

        self.assertEqual(asset_item["name"], "Laptop 1")
        self.assertEqual(asset_item["category"], "IT Equipment")
        self.assertEqual(training_item["title"], "Leadership Essentials")
        self.assertEqual(training_item["provider"], "HR Academy")
        self.assertEqual(recruitment_item["position"], "Data Analyst")
        self.assertEqual(recruitment_item["source"], "LinkedIn")

    def test_assets_training_and_recruitment_search_match_english_translations(self):
        assets_response = self.client.get("/api/assets/", {"search": "IT Equipment"}, HTTP_ACCEPT_LANGUAGE="en")
        training_response = self.client.get("/api/training/", {"search": "Leadership"}, HTTP_ACCEPT_LANGUAGE="en")
        recruitment_response = self.client.get("/api/recruitment/", {"search": "LinkedIn"}, HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(assets_response.status_code, status.HTTP_200_OK)
        self.assertEqual(training_response.status_code, status.HTTP_200_OK)
        self.assertEqual(recruitment_response.status_code, status.HTTP_200_OK)
        self.assertEqual(_results(assets_response.data)[0]["name"], "Laptop 1")
        self.assertEqual(_results(training_response.data)[0]["title"], "Leadership Essentials")
        self.assertEqual(_results(recruitment_response.data)[0]["position"], "Data Analyst")

    def test_report_filters_accept_english_bilingual_values(self):
        assets_response = self.client.get("/api/assets/report/", {"category": "IT Equipment"}, HTTP_ACCEPT_LANGUAGE="en")
        recruitment_response = self.client.get("/api/recruitment/report/", {"position": "Data Analyst"}, HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(assets_response.status_code, status.HTTP_200_OK)
        self.assertEqual(recruitment_response.status_code, status.HTTP_200_OK)
        self.assertEqual(assets_response.data[0]["name"], "Laptop 1")
        self.assertEqual(recruitment_response.data[0]["position"], "Data Analyst")
