import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "employees": "Employees",
      "attendance": "Attendance",
      "leaves": "Leaves",
      "structure": "Structure",
      "devices": "Devices",
      "jobTitles": "Job Titles",
      "users": "Users",
      "settings": "Settings",
      "search": "Search...",
      "add_employee": "Add Employee",
      "export": "Export",
      "filter": "Filter",
      "active": "Active",
      "on_leave": "On Leave",
      "inactive": "Inactive",
      "save_changes": "Save Changes",
      "company_data": "Company Data",
      "general_settings": "General Settings",
      "attendance_settings": "Attendance Settings",
      "leave_settings": "Leave Settings",
      "notifications": "Notifications",
      "theme": "Theme",
      "language": "Language",
      "light": "Light",
      "dark": "Dark",
      "system": "System",
      "arabic": "Arabic",
      "english": "English"
    }
  },
  ar: {
    translation: {
      "dashboard": "لوحة التحكم",
      "employees": "الموظفين",
      "attendance": "الحضور والانصراف",
      "leaves": "الإجازات",
      "structure": "الهيكل الإداري",
      "devices": "أجهزة البصمة",
      "jobTitles": "المسميات الوظيفية",
      "users": "المستخدمين",
      "settings": "الإعدادات",
      "search": "بحث...",
      "add_employee": "إضافة موظف",
      "export": "تصدير",
      "filter": "فلترة",
      "active": "نشط",
      "on_leave": "إجازة",
      "inactive": "غير نشط",
      "save_changes": "حفظ التغييرات",
      "company_data": "بيانات الشركة",
      "general_settings": "إعدادات عامة",
      "attendance_settings": "إعدادات الحضور والانصراف",
      "leave_settings": "إعدادات الإجازات",
      "notifications": "الإشعارات",
      "theme": "المظهر",
      "language": "اللغة",
      "light": "فاتح",
      "dark": "داكن",
      "system": "النظام",
      "arabic": "العربية",
      "english": "الإنجليزية"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
