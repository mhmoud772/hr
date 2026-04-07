from rest_framework import serializers
from .models import Attendance, AttendanceImportLog, Shift, EmployeeShift, BiometricLog

class AttendanceSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)

    class Meta:
        model = Attendance
        fields = "__all__"

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = "__all__"

class EmployeeShiftSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    shift_name = serializers.CharField(source="shift.name", read_only=True)

    class Meta:
        model = EmployeeShift
        fields = "__all__"

class BiometricLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiometricLog
        fields = "__all__"

class AttendanceImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceImportLog
        fields = "__all__"
