from rest_framework import serializers
from .models import (
    Department, JobTitle, Employee, EmployeeDocument, 
    Leave, LeaveAttachment, LeaveApproval, LeaveBalance,
    RecruitmentCandidate, PerformanceReview, TrainingRecord, Asset, PayrollRecord
)

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"

class JobTitleSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = JobTitle
        fields = "__all__"

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    job_title_name = serializers.CharField(source="job_title.name", read_only=True)
    employeeCode = serializers.CharField(source="employee_code", required=False)

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

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = "__all__"

class LeaveSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    employee_name = serializers.CharField(source="employee.name", read_only=True)

    class Meta:
        model = Leave
        fields = "__all__"

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

class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    reviewer_name = serializers.CharField(source="reviewer.name", read_only=True)

    class Meta:
        model = PerformanceReview
        fields = "__all__"

class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)
    assigned_to_code = serializers.CharField(source="assigned_to.employee_code", read_only=True)

    class Meta:
        model = Asset
        fields = "__all__"

class TrainingRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)

    class Meta:
        model = TrainingRecord
        fields = "__all__"

class RecruitmentCandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruitmentCandidate
        fields = "__all__"
