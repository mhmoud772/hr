from rest_framework import serializers
from .models import Attendance, AttendanceImportLog, Shift, EmployeeShift, BiometricLog


class LocalizedAttendanceFieldsMixin:
    def _resolve_language(self) -> str:
        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        return "en" if accept_language.lower().startswith("en") else "ar"


def _localize_attendance_import_message(message: str, language: str) -> str:
    text = str(message or "")
    if not text or not language.lower().startswith("ar"):
        return text
    if text == "Attendance import request recorded.":
        return "تم تسجيل طلب استيراد الحضور."
    return text

class AttendanceSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)

    class Meta:
        model = Attendance
        fields = "__all__"

class ShiftSerializer(LocalizedAttendanceFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = self._resolve_language()
        data["name"] = instance.get_localized_name(language)
        data["description"] = instance.get_localized_description(language)
        return data

class EmployeeShiftSerializer(LocalizedAttendanceFieldsMixin, serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    shift_name = serializers.SerializerMethodField()

    def get_shift_name(self, obj: EmployeeShift) -> str:
        return obj.shift.get_localized_name(self._resolve_language())

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        language = "en"
        request = self.context.get("request")
        accept_language = request.headers.get("Accept-Language", "") if request else ""
        if not accept_language.lower().startswith("en"):
            language = "ar"
        data["message"] = _localize_attendance_import_message(getattr(instance, "message", ""), language)
        return data
