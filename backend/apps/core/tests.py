from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="Test12345!")

    def test_login(self):
        url = reverse("login")
        response = self.client.post(url, {"username": "tester", "password": "Test12345!"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("accessToken", response.data)

    def test_me_requires_auth(self):
        url = reverse("me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class EmployeesTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="admin", password="Admin12345!", role="admin")
        login = self.client.post(reverse("login"), {"username": "admin", "password": "Admin12345!"}, format="json")
        self.token = login.data["accessToken"]

    def test_employees_list_requires_auth(self):
        url = reverse("employee-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_employees_list_with_auth(self):
        url = reverse("employee-list")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
