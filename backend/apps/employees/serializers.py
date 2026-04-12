from rest_framework import serializers
from .models import (
    Department, JobTitle, Employee, EmployeeDocument, 
    Leave, LeaveAttachment, LeaveApproval, LeaveBalance,
    RecruitmentCandidate, PerformanceReview, TrainingRecord, Asset, PayrollRecord
)


class LocalizedFieldsMixin:
    def _resolve_language(self) -> str:
        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        return "en" if accept_language.lower().startswith("en") else "ar"

    def _get_department_name(self, department):
        if department is None:
            return ""
        return department.get_localized_name(self._resolve_language())

    def _get_job_title_name(self, job_title):
        if job_title is None:
            return ""
        language = self._resolve_language()
        if language == "en" and job_title.name_en:
            return job_title.name_en
        return job_title.name

    def _get_localized_field(self, obj, field_name: str) -> str:
        if obj is None:
            return ""
        language = self._resolve_language()
        english_value = getattr(obj, f"{field_name}_en", "")
        if language == "en" and english_value:
            return english_value
        return getattr(obj, field_name, "")


class DepartmentSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    def get_name(self, obj: Department) -> str:
        return obj.get_localized_name(self._resolve_language())

    class Meta:
        model = Department
        fields = "__all__"

class JobTitleSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()

    def get_name(self, obj: JobTitle) -> str:
        return self._get_job_title_name(obj)

    def get_department_name(self, obj: JobTitle) -> str:
        return self._get_department_name(obj.department)

    class Meta:
        model = JobTitle
        fields = "__all__"

class EmployeeSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()
    job_title_name = serializers.SerializerMethodField()
    employeeCode = serializers.CharField(source="employee_code", required=False)

    def get_department_name(self, obj: Employee) -> str:
        return self._get_department_name(obj.department)

    def get_job_title_name(self, obj: Employee) -> str:
        return self._get_job_title_name(obj.job_title)

    class Meta:
        model = Employee
        fields = "__all__"

    def to_internal_value(self, data):
        mutable_data = dict(data)
        if "employeeCode" in mutable_data and "employee_code" not in mutable_data:
            mutable_data["employee_code"] = mutable_data["employeeCode"]
        return super().to_internal_value(mutable_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["employeeCode"] = data.get("employee_code")
        return data

class EmployeeDocumentSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["title"] = instance.get_localized_title(language)
        data["doc_type"] = instance.get_localized_doc_type(language)
        if language == "en" and getattr(instance, "notes_en", ""):
            data["notes"] = instance.notes_en
        return data

class LeaveSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    employee_name = serializers.CharField(source="employee.name", read_only=True)

    class Meta:
        model = Leave
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["reason"] = instance.get_localized_reason(self._resolve_language())
        return data

class LeaveBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveBalance
        fields = "__all__"

class PayrollRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)

    class Meta:
        model = PayrollRecord
        fields = "__all__"

class PerformanceReviewSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    reviewer_name = serializers.CharField(source="reviewer.name", read_only=True)

    class Meta:
        model = PerformanceReview
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self._resolve_language() == "en" and getattr(instance, "notes_en", ""):
            data["notes"] = instance.notes_en
        return data

class AssetSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)
    assigned_to_code = serializers.CharField(source="assigned_to.employee_code", read_only=True)

    class Meta:
        model = Asset
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["name"] = instance.get_localized_name(language)
        data["category"] = instance.get_localized_category(language)
        if language == "en" and getattr(instance, "notes_en", ""):
            data["notes"] = instance.notes_en
        return data

class TrainingRecordSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)

    class Meta:
        model = TrainingRecord
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["title"] = instance.get_localized_title(language)
        data["provider"] = instance.get_localized_provider(language)
        if language == "en" and getattr(instance, "notes_en", ""):
            data["notes"] = instance.notes_en
        return data

class RecruitmentCandidateSerializer(LocalizedFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = RecruitmentCandidate
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["position"] = instance.get_localized_position(language)
        data["source"] = instance.get_localized_source(language)
        if language == "en" and getattr(instance, "notes_en", ""):
            data["notes"] = instance.notes_en
        return data
