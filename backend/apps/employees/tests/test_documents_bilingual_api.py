from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.employees.models import Department, Employee, EmployeeDocument, JobTitle

User = get_user_model()


def _results(payload):
    if isinstance(payload, dict) and "results" in payload:
        return payload["results"]
    return payload


class EmployeeDocumentsBilingualAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="documents_admin",
            password="Admin12345!",
            role="system_admin",
            email="documents-admin@example.com",
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
            employee_code="EMP-DOC-001",
            email="mona.docs@example.com",
            department=self.department,
            job_title=self.job_title,
            status="active",
        )
        self.document = EmployeeDocument.objects.create(
            employee=self.employee,
            title="عقد العمل",
            title_en="Employment Contract",
            doc_type="عقد",
            doc_type_en="Contract",
            file=SimpleUploadedFile("contract.txt", b"demo contract"),
            uploaded_by=self.admin,
        )

    def test_documents_list_returns_localized_english_fields(self):
        response = self.client.get("/api/documents/", HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["title"], "Employment Contract")
        self.assertEqual(item["doc_type"], "Contract")

    def test_documents_search_matches_english_translation(self):
        response = self.client.get("/api/documents/", {"search": "Employment Contract"}, HTTP_ACCEPT_LANGUAGE="en")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = _results(response.data)[0]
        self.assertEqual(item["title"], "Employment Contract")
