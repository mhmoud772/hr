import i18n from "i18next";



import { initReactI18next } from "react-i18next";



import LanguageDetector from "i18next-browser-languagedetector";







const resources = {



  en: {



    translation: {



      dashboard: "Dashboard",



      employees: "Employees",



      attendance: "Attendance",



      leaves: "Leaves",



      self_service_title: "Self service",



      self_service_subtitle: "Manage your profile, attendance, and leave requests",



      my_profile: "My profile",



      my_attendance: "My attendance",



      my_leaves: "My leaves",



      my_documents: "My documents",
      self_service_balances: "Leave balances",
      self_service_approvals: "Approvals",
      self_service_payroll: "Payslips",
      self_service_assets: "My assets",
      self_service_training: "Training",
      self_service_performance: "Performance",
      self_service_notifications: "Notifications",
      status_read: "Read",
      status_unread: "Unread",
      mark_read: "Mark as read",
      mark_all_read: "Mark all as read",
      self_service_security: "Security",



      request_leave: "Request leave",



      structure: "Structure",



      devices: "Devices",



      jobTitles: "Job Titles",



      users: "Users",



      settings: "Settings",



      search: "Search...",



      add_employee: "Add Employee",



      export: "Export",



      filter: "Filter",



      active: "Active",



      on_leave: "On Leave",



      inactive: "Inactive",



      save_changes: "Save Changes",
      self_service_profile_updated: "Profile updated",
      self_service_profile_update_failed: "Failed to update profile",
      self_service_security_hint: "Manage password and security preferences",
      self_service_mfa_hint: "Multi-factor authentication is not enabled",



      company_data: "Company Data",



      general_settings: "General Settings",



      attendance_settings: "Attendance Settings",



      leave_settings: "Leave Settings",



      notifications: "Notifications",



      documents: "Documents",



      document_title: "Document title",



      document_type: "Document type",



      document_uploaded: "Document uploaded",



      document_uploaded_desc: "Document uploaded successfully",



      document_deleted: "Document deleted",



      document_deleted_desc: "Document deleted successfully",



      no_documents: "No documents available",



      notes: "Notes",



      upload: "Upload",



      theme: "Theme",



      language: "Language",



      light: "Light",



      dark: "Dark",



      system: "System",



      arabic: "Arabic",



      english: "English",



      loading: "Loading...",
      no_data: "No data available",



      error_loading: "Failed to load data",



      retry: "Retry",



      dashboard_title: "Dashboard",



      dashboard_subtitle: "Overview of HR data",



      total_employees: "Total employees",



      present_today: "Present today",



      absent: "Absent",



      leave_requests: "Leave requests",



      critical_leaves: "Critical leaves",



      adherence_rate: "Attendance adherence",



      average_late_minutes: "Avg late minutes",



      present_label: "Present",



      absent_label: "Absent",



      weekly_attendance_stats: "Weekly attendance stats",



      department_distribution: "Department distribution",



      recent_activities: "Recent activities",



      filter_range: "Time range",



      range_today: "Today",



      range_week: "This week",



      range_month: "This month",



      no_activity: "No recent activities",



      day_sat: "Saturday",



      day_sun: "Sunday",



      day_mon: "Monday",



      day_tue: "Tuesday",



      day_wed: "Wednesday",



      day_thu: "Thursday",



      dept_admin: "Administration",



      dept_sales: "Sales",



      dept_tech: "Technology",



      dept_hr: "Human Resources",



      activity_checkin: "Checked in",



      activity_leave_request: "Leave request",



      activity_checkout: "Checked out",



      activity_leave_approved: "Leave approved",



      employees_title: "Employees Management",



      employees_subtitle: "View and manage all employees",



      employees_list_count: "Employees List ({{count}})",



      search_employee_placeholder: "Search by name or employee ID...",



      employee_id: "Employee ID",



      employee_id_required: "Employee ID is required",



      name: "Name",



      department: "Department",



      job_title: "Job title",



      hire_date: "Hire date",



      status: "Status",



      actions: "Actions",



      action: "Action",



      model: "Model",



      object_id: "Object ID",



      view_details: "View details",



      edit: "Edit",



      delete: "Delete",



      create: "Create",



      update: "Update",



      delete_employee_title: "Delete employee",



      delete_employee_desc:



        'Are you sure you want to delete employee "{{name}}"? This action cannot be undone.',



      employee_deleted: "Employee deleted",



      employee_deleted_desc: 'Employee "{{name}}" was deleted successfully',



      employee_updated: "Employee updated",



      employee_updated_desc: "Employee data updated successfully",



      employee_added: "Employee added",



      employee_added_desc: "Employee added successfully",



      email: "Email",



      phone: "Phone",



      settings_title: "Settings",



      settings_subtitle: "Manage system settings",



      tab_company: "Company",



      tab_general: "General",



      tab_attendance: "Attendance",



      tab_leaves: "Leaves",



      tab_notifications: "Notifications",



      company_title: "Company information",



      company_desc: "Basic company details",



      company_name_ar: "Company name (Arabic)",



      company_name_en: "Company name (English)",



      company_email: "Email",



      company_phone: "Phone",



      company_address: "Address",



      general_title: "General settings",



      general_desc: "Configure theme and language",



      theme_label: "Theme",



      language_label: "Language",



      timezone_label: "Time zone",



      select_theme: "Select theme",



      select_language: "Select language",



      select_timezone: "Select time zone",



      attendance_settings_title: "Attendance settings",



      attendance_desc: "Set working hours and late rules",



      work_start_time: "Work start time",



      work_end_time: "Work end time",



      late_threshold_minutes: "Late threshold (minutes)",



      early_leave_threshold_minutes: "Early leave threshold (minutes)",



      advanced_options: "Advanced options",



      enable_geolocation_title: "Enable geolocation",



      enable_geolocation_desc: "Verify employee location during check-in",



      enable_face_recognition_title: "Face recognition",



      enable_face_recognition_desc: "Use face recognition to verify identity",



      leave_title: "Leave settings",



      leave_desc: "Configure default leave balances",



      annual_leave_days: "Annual leave (days)",



      sick_leave_days: "Sick leave (days)",



      emergency_leave_days: "Emergency leave (days)",



      min_advance_notice_days: "Minimum advance notice (days)",



      require_leave_approval_title: "Require leave approvals",



      require_leave_approval_desc:



        "Manager approval required for leave requests",



      approval_levels: "Approval levels",



      approval_level_1: "One level",



      approval_level_2: "Two levels",
      tpl_leave_request_body_no_var: "A new leave request was submitted.",
      tpl_leave_request_sms_no_var: "New leave request received.",
      tpl_leave_approved_body_no_var: "Leave approved.",
      tpl_leave_approved_sms_no_var: "Leave approved.",
      tpl_leave_rejected_body_no_var: "Leave rejected.",
      tpl_leave_rejected_sms_no_var: "Leave rejected.",
      tpl_attendance_alert_body_no_var: "Attendance alert.",
      tpl_attendance_alert_sms_no_var: "Attendance alert.",
      tpl_weekly_report_body_no_var: "Weekly summary is ready.",
      tpl_weekly_report_sms_no_var: "Weekly report ready.",
      template_hint_no_var: "Templates do not use variables.",
      company_name_en_example: "Example Tech Company",
      tpl_leave_request_subject: "New leave request",
      tpl_leave_request_body: "A new leave request was submitted for {{employee}}.",
      tpl_leave_request_sms: "Leave request for {{employee}}.",
      tpl_leave_approved_subject: "Leave approved",
      tpl_leave_approved_body: "Leave approved for {{employee}}.",
      tpl_leave_approved_sms: "Leave approved for {{employee}}.",
      tpl_leave_rejected_subject: "Leave rejected",
      tpl_leave_rejected_body: "Leave rejected for {{employee}}.",
      tpl_leave_rejected_sms: "Leave rejected for {{employee}}.",
      tpl_attendance_alert_subject: "Attendance alert",
      tpl_attendance_alert_body: "Attendance alert for {{employee}}.",
      tpl_attendance_alert_sms: "Attendance alert for {{employee}}.",
      tpl_weekly_report_subject: "Weekly HR report",
      tpl_weekly_report_body: "Weekly summary is ready.",
      tpl_weekly_report_sms: "Weekly report ready.",

      work_week: "Work week",
      work_days: "Work days",
      weekend_days: "Weekend days",
      holiday_calendar: "Holiday calendar",
      holiday_calendar_desc: "Manage official holidays and exceptions",
      holiday_type_holiday: "Holiday",
      holiday_type_event: "Event",
      holiday_type_exception: "Exception",
      digest_time: "Digest time",
      weekly_digest_day: "Weekly digest day",
      quiet_hours_enabled: "Quiet hours enabled",
      quiet_hours_desc: "Pause email/SMS outside working hours",
      notification_templates: "Notification templates",
      email_subject: "Email subject",
      email_body: "Email body",
      sms_body: "SMS body",
      template_hint: "You can use {{employee}} in templates.",
      security_settings_desc: "Control MFA and password policies",
      mfa_enabled: "Enable MFA",
      mfa_enabled_desc: "Allow users to enable MFA",
      mfa_required: "Require MFA",
      mfa_required_desc: "Force MFA for all users",
      password_min_length: "Minimum password length",
      password_expiry_days: "Password expiry (days)",
      password_require_upper: "Require uppercase",
      password_require_upper_desc: "At least one uppercase letter",
      password_require_number: "Require number",
      password_require_number_desc: "At least one number",
      password_require_symbol: "Require symbol",
      password_require_symbol_desc: "At least one special character",
      backup_restore: "Backup & restore",
      backup_restore_desc: "Export settings or restore from a backup file",
      backup_history: "Backup history",

      settings_permissions: "Settings access",
      settings_permissions_desc: "Choose which roles can access each settings tab",

      day_fri: "Friday",




      notifications_title: "Notifications settings",



      notifications_desc: "Manage alerts and notifications",



      notification_channels_title: "Notification channels",



      email_notifications_title: "Email notifications",



      email_notifications_desc: "Receive notifications by email",



      sms_notifications_title: "SMS notifications",



      sms_notifications_desc: "Receive notifications by SMS",



      notification_types_title: "Notification types",



      leave_request_notify_title: "Leave requests",



      leave_request_notify_desc: "Notify on new leave request",



      attendance_alerts_title: "Attendance alerts",



      attendance_alerts_desc: "Alert on late arrival or absence",



      weekly_reports_title: "Weekly reports",



      weekly_reports_desc: "Weekly summary of attendance and leaves",



      reports_title: "Reports",



      reports_subtitle: "Generate HR reports",
      report_type_attendance: "Attendance",
      report_type_leaves: "Leaves",
      report_type_payroll: "Payroll",
      report_type_recruitment: "Recruitment",
      report_type_performance: "Performance",
      report_type_training: "Training",
      report_type_assets: "Assets",
      report_type_discipline: "Discipline",
      generate_report: "Generate report",
      generate_report_hint: "Generate a report to see data here.",
      export_csv: "Export CSV",
      export_excel: "Export Excel",



      generate_reports: "Generate reports",



      attendance_report_title: "Attendance report",



      leave_report_title: "Leave report",



      records_count: "Records: {{count}}",



      saved: "Saved",



      settings_saved_desc: "Settings for {{section}} saved successfully",



      saving: "Saving...",



      invalid_email: "البريد الإلكتروني غير صحيح",



      invalid_phone: "Invalid phone",



      timezone_required: "Time zone is required",



      work_time_invalid: "Work end time must be after start time",



      upload_logo: "Upload logo",



      no_logo: "No logo",



      export_settings: "Export settings",



      import_settings: "Import settings",



      import_success: "Settings imported",



      import_failed: "Failed to import settings",



      reset_defaults: "Reset defaults",



      reset_done: "Defaults restored",



      time_format: "Time format",



      select_time_format: "Select time format",



      week_start: "Week starts on",



      select_week_start: "Select week start",



      digest_frequency: "Digest frequency",



      select_frequency: "Select frequency",



      frequency_instant: "Instant",



      frequency_daily: "Daily",



      frequency_weekly: "Weekly",



      notifications_enabled: "Notifications enabled",



      quiet_hours_start: "Quiet hours start",



      quiet_hours_end: "Quiet hours end",



      login_title: "Sign in",



      register_title: "Create account",



      username: "Username",



      password: "Password",



      show: "Show",



      hide: "Hide",



      confirm_password: "Confirm password",



      full_name: "Full name",



      login: "Login",



      logout: "Logout",



      register: "Register",



      change_password: "Change password",



      current_password: "Current password",



      new_password: "New password",



      password_changed: "Password updated",



      password_change_failed: "Failed to update password",



      remember_me: "Remember me",



      forgot_password: "Forgot password?",
      login_demo_admin: "Demo admin",
      login_demo_employee: "Demo employee",



      reset_password_title: "إعادة تعيين كلمة المرور",



      reset_password_desc: "أدخل بريدك لاستلام رابط إعادة التعيين",



      reset_password_submit: "إرسال رابط إعادة التعيين",



      reset_password_sent_title: "تحقق من بريدك",



      reset_password_sent_desc: "إذا كان البريد موجودًا، أرسلنا رابط إعادة تعيين وإرشادات الخطوات التالية",

      reset_password_new_title: "تعيين كلمة مرور جديدة",



      reset_password_new_desc: "أدخل كلمة مرور جديدة لحسابك",



      reset_password_new_submit: "تحديث كلمة المرور",



      reset_password_invalid_link: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية",



      reset_password_success_desc: "Your password has been updated successfully",



      have_account: "Already have an account? Sign in",



      create_account: "Create a new account",



      generic_error: "حدث خطأ",



      invalid_login: "Invalid login credentials",
      login_locked: "Too many attempts. Please try again in a minute.",
      session_expired: "Session expired. Please sign in again.",


      register_failed: "Registration failed",






      username_required: "Username is required",



      password_min: "Password must be at least 6 characters",



      confirm_password_required: "Confirm password is required",



      passwords_not_match: "Passwords do not match",



      not_found_title: "Page not found",



      not_found_desc: "The page you are looking for does not exist",



      back_home: "Back to home",



      previous: "Previous",



      next: "Next",



      not_authorized_title: "Not authorized",



      not_authorized_desc: "You do not have permission to access this page",



      app_name: "HR System",



      app_subtitle: "Employee management",



      main_menu: "Main menu",



      administration: "Administration",



      trend_from_last_month: "{{value}}% from last month",



      default_user_name: "System Admin",



      default_user_role: "System Admin",



      cancel: "Cancel",



      save: "Save",



      add: "Add",



      approve: "Approve",



      reject: "Reject",



      employee_form_add_title: "Add new employee",



      employee_form_edit_title: "Edit employee",



      additional_details: "Additional details",



      nationality: "Nationality",



      birth_date: "Birth date",



      address: "Address",



      salary: "Salary",



      contract_status: "Contract status",



      contract_permanent: "Permanent",



      contract_contract: "Contract",



      contract_probation: "Probation",



      contract_terminated: "Terminated",



      avatar: "Profile photo",



      import: "Import",



      import_employees_success: "Import completed",



      import_employees_success_desc: "Created {{created}}, updated {{updated}}",



      attendance_summary: "Attendance summary",



      leaves_summary: "Leaves summary",



      full_name_label: "Full name",



      select_department: "Select department",



      select_job_title: "Select job title",



      status_active: "نشط",



      status_on_leave: "إجازة",



      status_inactive: "غير نشط",



      name_required: "Name is required",



      email_invalid: "البريد الإلكتروني غير صحيح",



      phone_invalid: "Invalid phone number",



      department_required: "Department is required",



      job_title_required: "Job title is required",



      hire_date_required: "Hire date is required",



      leave_form_add_title: "New leave request",



      leave_form_edit_title: "Edit leave request",



      leave_type_label: "Leave type",



      select_leave_type: "Select leave type",



      from_date: "From date",



      to_date: "To date",



      reason: "Reason",



      leave_reason_placeholder: "Enter leave reason...",



      send_request: "Send request",



      leave_type_required: "Leave type is required",



      start_date_required: "Start date is required",



      end_date_required: "End date is required",



      end_after_start: "End date must be after start date",



      employee_required: "Employee is required",



      select_employee: "Select employee",



      attachments: "Attachments",



      approval_log: "Approval log",



      attendance_title: "Attendance",



      attendance_subtitle: "Track employee attendance records",



      date: "Date",



      add_attendance: "Add attendance",



      attendance_form_add_title: "Add attendance record",



      attendance_form_edit_title: "Edit attendance record",



      attendance_added: "Attendance added",



      attendance_added_desc: "Attendance record created successfully",



      attendance_updated: "Attendance updated",



      attendance_updated_desc: "Attendance record updated successfully",



      attendance_deleted: "Attendance deleted",



      attendance_deleted_desc: "Attendance record deleted successfully",



      delete_attendance_title: "Delete attendance",



      delete_attendance_desc: "Are you sure you want to delete this attendance record?",



      date_required: "Date is required",



      status_required: "Status is required",



      invalid_time_range: "Check-out must be after check-in",



      close_day: "Close day",



      attendance_closed: "Day closed",



      attendance_closed_desc: "Updated {{count}} record(s)",



      sync_devices: "Sync devices",



      import_logs: "Import logs",



      attendance_imported: "Attendance imported",



      today: "Today",



      export_pdf: "Export PDF",



      search_by_name_or_id: "Search by name or employee ID...",



      status_filter: "Status",



      status_all: "All",



      status_present: "Present",



      status_absent: "Absent",



      status_late: "Late",



      more: "More",



      attendance_record: "Attendance record",



      employee_name: "Employee name",



      check_in_time: "Check-in time",



      check_out_time: "Check-out time",



      work_hours: "Work hours",



      late_count: "Late",



      leaves_title: "Leave management",



      leaves_subtitle: "Leave requests and balances",



      new_leave_request: "New leave request",



      total_balance: "Total balance",



      used_balance: "Used",



      remaining_balance: "Remaining",



      leave_requests_title: "Leave requests",



      days_count: "Days",



      days: "day(s)",



      approved: "Approved",



      rejected: "Rejected",



      pending: "Pending",



      leave_deleted: "Leave deleted",



      leave_deleted_desc: "Leave request deleted successfully",



      leave_added: "Leave added",



      leave_added_desc: "Leave request created successfully",



      leave_updated: "Leave updated",



      leave_updated_desc: "Leave request updated successfully",



      delete_leave_title: "Delete leave request",



      delete_leave_desc:



        "Are you sure you want to delete this request? This action cannot be undone.",



      leave_details_title: "Leave request",



      devices_title: "Biometric devices",



      devices_subtitle: "Manage and monitor attendance devices",



      add_device: "Add device",



      total_devices: "Total devices",



      online: "Online",



      offline: "Offline",



      devices_list: "Devices list",



      device_name: "Device name",



      serial_number: "Serial number",



      ip_address: "IP address",



      location: "Location",



      last_sync: "Last sync",



      last_seen: "Last seen",



      device_settings: "Device settings",



      sync_now: "Sync now",



      sync_logs: "Sync logs",



      sync_success: "Sync completed",



      sync_failed: "Sync failed",



      device_name_required: "Device name is required",



      serial_required: "Serial number is required",



      invalid_ip: "Invalid IP address",



      location_required: "Location is required",



      employee_count: "Employees count",



      device_deleted: "Device deleted",



      device_deleted_desc: 'Device "{{name}}" deleted successfully',



      device_updated: "Device updated",



      device_updated_desc: "Device updated successfully",



      device_added: "Device added",



      device_added_desc: "Device added successfully",



      delete_device_title: "Delete device",



      delete_device_desc:



        'Are you sure you want to delete "{{name}}"? This action cannot be undone.',



      job_titles_title: "Job titles",



      job_titles_subtitle: "Manage job titles and levels",



      add_job_title: "Add job title",



      job_titles_list: "Job titles list",



      level_required: "Level is required",



      min_salary_required: "Minimum salary is required",



      max_salary_required: "Maximum salary is required",



      salary_range_invalid: "Maximum salary must be >= minimum salary",



      cannot_delete_job_title: "Cannot delete job title",



      job_delete_has_employees: "This job title has assigned employees",






      select_level: "Select level",



      job_title_ar: "Job title (Arabic)",



      job_title_en: "Job title (English)",



      level: "Level",



      salary_range: "Salary range",



      min_salary: "Minimum salary",



      max_salary: "Maximum salary",



      job_description: "Job description",



      delete_job_title: "Delete job title",



      delete_job_title_desc:



        'Are you sure you want to delete "{{name}}"? This action cannot be undone.',



      job_deleted: "Job title deleted",



      job_deleted_desc: 'Job title "{{name}}" deleted successfully',



      job_updated: "Job title updated",



      job_updated_desc: "Job title updated successfully",



      job_added: "Job title added",



      job_added_desc: "Job title added successfully",



      users_title: "Users",



      users_subtitle: "Manage system users and permissions",



      audit_logs_title: "Audit logs",



      audit_logs_subtitle: "Track system changes",



      add_user: "Add user",



      total_users: "Total users",



      system_admins: "System admins",



      users_list: "Users list",



      username_taken: "Username already exists",



      cannot_delete_self: "You cannot delete your own account",



      cannot_change_own_role: "You cannot change your own role",



      force_password_change: "Force password change",



      force_password_change_desc: "Require change on next login",



      role_permissions_hint: "Permissions are derived from role",



      use_role_permissions: "Use role permissions",



      user: "User",



      role: "Role",



      last_login: "Last login",



      perm_employees: "Manage employees",



      perm_attendance: "Attendance",



      perm_leaves: "Leave management",



      perm_reports: "Reports",



      perm_structure: "Organization structure",



      perm_devices: "Devices",



      perm_payroll: "Payroll",



      perm_recruitment: "Recruitment",



      perm_performance: "Performance",



      perm_training: "Training",



      perm_assets: "Assets",



      perm_settings: "Settings",



      perm_users: "Users management",



      perm_self_service: "Self service",



      permissions: "Permissions",
      permissions_select_all: "Select all",
      permissions_clear_all: "Clear all",



      select_role: "Select role",



      user_deleted: "User deleted",



      user_deleted_desc: 'User "{{name}}" deleted successfully',



      user_updated: "User updated",



      user_updated_desc: "User updated successfully",



      user_added: "User added",



      user_added_desc: "User added successfully",



      delete_user_title: "Delete user",



      delete_user_desc:



        'Are you sure you want to delete user "{{name}}"? This action cannot be undone.',



      structure_title: "Organization structure",



      structure_subtitle: "Manage departments",



      add_department: "Add department",



      department_tree: "Departments tree",



      no_departments: "No departments",



      start_by_adding_department: "Start by adding the first department",



      delete_department_title: "Delete department",



      delete_department_desc:



        'Are you sure you want to delete department "{{name}}"? All sub-departments will be deleted.',



      department_deleted: "Department deleted",



      department_deleted_desc: 'Department "{{name}}" deleted successfully',



      department_updated: "Department updated",



      department_added: "Department added",



      department_updated_desc: 'Department "{{name}}" updated successfully',



      department_added_desc: 'Department "{{name}}" added successfully',



      department_name: "Department name",



      department_manager: "Department manager",



      parent_department: "Parent department",



      parent_none: "None (root department)",



      select_manager: "Select manager",



      none: "None",



      manager_label: "Manager",



      add_sub_department: "Add sub-department",



      edit_department: "Edit department",



      drag_to_reorder: "Drag to reorder",



      order_saved: "Order saved",



      department_parent_invalid: "Invalid parent department",



      cannot_move_into_child: "Cannot move department into its child",



      leave_type_annual: "Annual leave",



      leave_type_sick: "Sick leave",



      leave_type_emergency: "Emergency leave",



      leave_type_unpaid: "Unpaid leave",



      role_system_admin: "System admin",



      role_hr_manager: "HR manager",



      role_supervisor: "Supervisor",



      role_employee: "Employee",



      dept_top_management: "Top management",






      dept_hr_full: "Human Resources",



      dept_it: "Information Technology",



      dept_finance: "Finance",






      level_executive: "Executive",



      level_manager: "Manager",



      level_specialist: "Specialist",



      level_junior: "Junior",
      level_mid: "Mid",
      level_senior: "Senior",



      job_title_manager: "Department manager",



      job_title_hr_manager: "HR manager",



      job_title_hr_specialist: "HR specialist",



      job_title_software_dev: "Software developer",



      job_title_sales_rep: "Sales representative",



      job_title_accountant: "Accountant",



      sample_person_ahmed_mohammed_ali: "Ahmed Mohammed Ali",



      sample_person_sara_ahmed_hassan: "Sara Ahmed Hassan",



      sample_person_mohammed_khaled_omar: "Mohammed Khaled Omar",



      sample_person_fatima_ali_mahmoud: "Fatima Ali Mahmoud",



      sample_person_abdullah_saeed: "Abdullah Saeed",



      sample_person_ahmed_mohammed: "Ahmed Mohammed",



      sample_person_sara_ali: "Sara Ali",



      sample_person_mohammed_khaled: "Mohammed Khaled",



      sample_person_fatima_hassan: "Fatima Hassan",



      sample_person_noura_saad: "Noura Saad",



      sample_person_ali_hassan: "Ali Hassan",



      sample_person_fahd_ahmed: "Fahd Ahmed",



      sample_person_fatima_abdullah: "Fatima Abdullah",



      sample_reason_family_leave: "Family leave",



      sample_reason_sick: "Illness",



      sample_reason_personal: "Personal reasons",



      sample_reason_travel: "Travel",



      dept_recruitment: "Recruitment",



      dept_training: "Training & Development",



      dept_software: "Software Development",



      dept_support: "Technical Support",



      job_desc_general_manager: "Responsible for overall management",



      job_desc_hr_manager: "Manage HR operations and recruiting",



      job_desc_hr_specialist: "Implement HR policies",



      job_desc_senior_dev: "Develop and build applications",



      job_desc_software_dev: "Assist in software development",



      job_desc_accountant: "Manage accounting and financial entries",



      sample_attendance_date: "Jan 15, 2024",



      job_title_general_manager: "General Manager",



      job_title_senior_dev: "Senior Developer",



      company_name_example: "Example Tech Company",



      company_address_example: "Riyadh, Saudi Arabia",



      time_0830_am: "08:30 AM",



      time_0915_am: "09:15 AM",



      time_0500_pm: "05:00 PM",



      time_1030_am: "10:30 AM",



      timezone_riyadh: "Riyadh (GMT+3)",



      timezone_dubai: "Dubai (GMT+4)",



      timezone_cairo: "Cairo (GMT+2)",



      payroll_title: "Payroll",



      payroll_subtitle: "Manage payroll records",



      payroll_records: "Payroll records",



      base_salary: "Base salary",



      allowances: "Allowances",



      deductions: "Deductions",
      net_salary: "Net salary",



      status_draft: "Draft",



      status_paid: "Paid",



      recruitment_title: "Recruitment",



      recruitment_subtitle: "Manage candidates and hiring pipeline",



      recruitment_candidates: "Candidates",



      position: "Position",



      source: "Source",



      candidate_status_applied: "Applied",



      candidate_status_screening: "Screening",



      candidate_status_interview: "Interview",



      candidate_status_offered: "Offered",



      candidate_status_hired: "Hired",



      candidate_status_rejected: "Rejected",



      performance_title: "Performance",



      performance_subtitle: "Employee performance reviews",



      performance_reviews: "Performance reviews",



      period: "Period",



      reviewer: "Reviewer",
      rating: "Rating",



      training_title: "Training",



      training_subtitle: "Employee training records",



      training_records: "Training records",



      title: "Title",



      provider: "Provider",



      training_status_planned: "Planned",



      training_status_in_progress: "In progress",



      training_status_completed: "Completed",



      training_status_cancelled: "Cancelled",



      assets_title: "Assets",



      assets_subtitle: "Manage company assets",



      assets_list: "Assets list",



      asset_name: "Asset name",



      category: "Category",



      assigned_to: "Assigned to",



      asset_status_available: "Available",



      asset_status_assigned: "Assigned",



      asset_status_maintenance: "Maintenance",



      asset_status_retired: "Retired",



    },



  },



  ar: {



    translation: {



      dashboard: "لوحة التحكم",



      employees: "الموظفين",



      attendance: "الحضور والانصراف",



      leaves: "الإجازات",



      structure: "الهيكل الإداري",



      devices: "أجهزة البصمة",



      jobTitles: "المسميات الوظيفية",



      users: "المستخدمين",



      settings: "الإعدادات",



      search: "بحث...",



      add_employee: "إضافة موظف",



      export: "تصدير",



      filter: "فلترة",



      active: "نشط",



      on_leave: "إجازة",



      inactive: "غير نشط",



      save_changes: "حفظ التغييرات",
      self_service_profile_updated: "تم تحديث البيانات",
      self_service_profile_update_failed: "تعذر تحديث البيانات",
      self_service_security_hint: "إدارة كلمة المرور وتفضيلات الأمان",
      self_service_mfa_hint: "المصادقة متعددة العوامل غير مفعلة",



      company_data: "بيانات الشركة",



      general_settings: "إعدادات عامة",



      attendance_settings: "إعدادات الحضور والانصراف",



      leave_settings: "إعدادات الإجازات",



      notifications: "الإشعارات",



      theme: "المظهر",



      language: "اللغة",



      light: "فاتح",



      dark: "داكن",



      system: "النظام",



      arabic: "العربية",
      no_data: "لا توجد بيانات",



      english: "الإنجليزية",



      loading: "جاري التحميل...",



      error_loading: "تعذر تحميل البيانات",



      retry: "إعادة المحاولة",



      dashboard_title: "لوحة التحكم",



      dashboard_subtitle: "نظرة عامة على بيانات الموارد البشرية",



      total_employees: "إجمالي الموظفين",



      present_today: "الحاضرون اليوم",



      absent: "الغائبون",



      leave_requests: "طلبات الإجازة",



      critical_leaves: "إجازات حرجة",



      adherence_rate: "نسبة الالتزام",



      average_late_minutes: "متوسط التأخير (دقيقة)",



      present_label: "حضور",



      absent_label: "غياب",



      weekly_attendance_stats: "إحصائيات الحضور الأسبوعية",



      department_distribution: "توزيع الأقسام",



      recent_activities: "آخر النشاطات",



      filter_range: "النطاق الزمني",



      range_today: "اليوم",



      range_week: "الأسبوع",



      range_month: "الشهر",



      no_activity: "لا توجد نشاطات حديثة",



      day_sat: "السبت",



      day_sun: "الأحد",



      day_mon: "الاثنين",



      day_tue: "الثلاثاء",



      day_wed: "الأربعاء",



      day_thu: "الخميس",
      day_fri: "الجمعة",



      dept_admin: "الإدارة",



      dept_sales: "المبيعات",



      dept_tech: "التقنية",



      dept_hr: "الموارد البشرية",



      activity_checkin: "تسجيل حضور",



      activity_leave_request: "طلب إجازة",



      activity_checkout: "تسجيل انصراف",



      activity_leave_approved: "إجازة مقبولة",



      employees_title: "إدارة الموظفين",



      employees_subtitle: "عرض وإدارة بيانات جميع الموظفين",



      employees_list_count: "قائمة الموظفين ({{count}})",



      search_employee_placeholder: "بحث بالاسم أو رقم الموظف...",



      employee_id: "رقم الموظف",



      employee_id_required: "رقم الموظف مطلوب",



      name: "الاسم",



      department: "القسم",



      job_title: "المسمى الوظيفي",



      hire_date: "تاريخ التعيين",



      status: "الحالة",



      actions: "الإجراءات",



      view_details: "عرض التفاصيل",



      edit: "تعديل",



      delete: "حذف",



      delete_employee_title: "حذف الموظف",



      delete_employee_desc:



        'هل أنت متأكد من حذف الموظف "{{name}}"؟ لا يمكن التراجع عن هذا الإجراء.',



      employee_deleted: "تم حذف الموظف",



      employee_deleted_desc: 'تم حذف الموظف "{{name}}" بنجاح',



      employee_updated: "تم تحديث الموظف",



      employee_updated_desc: "تم تعديل بيانات الموظف بنجاح",



      employee_added: "تم إضافة الموظف",



      employee_added_desc: "تم إضافة الموظف بنجاح",



      email: "البريد الإلكتروني",



      phone: "رقم الهاتف",



      settings_title: "الإعدادات",



      settings_subtitle: "إدارة إعدادات النظام",



      tab_company: "بيانات الشركة",



      tab_general: "إعدادات عامة",



      tab_attendance: "الحضور والانصراف",



      tab_leaves: "الإجازات",



      tab_notifications: "الإشعارات",



      company_title: "بيانات الشركة",



      company_desc: "معلومات الشركة الأساسية",



      company_name_ar: "اسم الشركة (عربي)",



      company_name_en: "اسم الشركة (إنجليزي)",



      company_email: "البريد الإلكتروني",



      company_phone: "رقم الهاتف",



      company_address: "العنوان",



      general_title: "إعدادات عامة",



      general_desc: "ضبط مظهر النظام واللغة",



      theme_label: "المظهر",



      language_label: "اللغة",



      timezone_label: "المنطقة الزمنية",



      select_theme: "اختر المظهر",
      work_week: "أسبوع العمل",
      work_days: "أيام العمل",
      weekend_days: "أيام الإجازة",
      holiday_calendar: "تقويم العطلات",
      holiday_calendar_desc: "إدارة العطلات الرسمية والاستثناءات",
      holiday_type_holiday: "عطلة",
      holiday_type_event: "فعالية",
      holiday_type_exception: "استثناء",



      select_language: "اختر اللغة",



      select_timezone: "اختر المنطقة الزمنية",



      attendance_settings_title: "إعدادات الحضور والانصراف",



      attendance_desc: "ضبط أوقات الدوام وقواعد التأخير",



      work_start_time: "وقت بداية الدوام",



      work_end_time: "وقت نهاية الدوام",



      late_threshold_minutes: "حد التأخير المسموح (بالدقائق)",



      early_leave_threshold_minutes: "حد الخروج المبكر المسموح (بالدقائق)",



      advanced_options: "خيارات متقدمة",



      enable_geolocation_title: "تفعيل الموقع الجغرافي",



      enable_geolocation_desc: "التحقق من موقع الموظف عند تسجيل الحضور",



      enable_face_recognition_title: "التعرف على الوجه",



      enable_face_recognition_desc: "استخدام التعرف على الوجه للتحقق من الهوية",



      leave_title: "إعدادات الإجازات",



      leave_desc: "ضبط أرصدة الإجازات الافتراضية",



      annual_leave_days: "الإجازة السنوية (يوم)",



      sick_leave_days: "الإجازة المرضية (يوم)",



      emergency_leave_days: "الإجازة الطارئة (يوم)",



      min_advance_notice_days: "الحد الأدنى لتقديم طلب الإجازة (بالأيام)",



      require_leave_approval_title: "طلب الموافقة على الإجازات",



      require_leave_approval_desc: "يتطلب موافقة المدير على طلبات الإجازة",



      notifications_title: "إعدادات الإشعارات",



      notifications_desc: "التحكم في الإشعارات والتنبيهات",



      notification_channels_title: "قنوات الإشعارات",



      email_notifications_title: "إشعارات البريد الإلكتروني",



      email_notifications_desc: "استلام الإشعارات عبر البريد الإلكتروني",



      sms_notifications_title: "الرسائل النصية SMS",



      sms_notifications_desc: "استلام الإشعارات عبر الرسائل النصية",



      notification_types_title: "أنواع الإشعارات",



      leave_request_notify_title: "طلبات الإجازة",



      leave_request_notify_desc: "إشعار عند استلام طلب إجازة جديد",



      attendance_alerts_title: "تنبيهات الحضور",



      attendance_alerts_desc: "تنبيه عند التأخير أو الغياب",



      weekly_reports_title: "التقارير الأسبوعية",



      weekly_reports_desc: "استلام ملخص أسبوعي للحضور والإجازات",



      saved: "تم الحفظ",



      settings_saved_desc: "تم حفظ إعدادات {{section}} بنجاح",



      saving: "جاري الحفظ...",



      invalid_email: "البريد الإلكتروني غير صحيح",



      invalid_phone: "رقم الهاتف غير صحيح",



      timezone_required: "المنطقة الزمنية مطلوبة",



      work_time_invalid: "وقت الانتهاء يجب أن يكون بعد وقت البداية",



      upload_logo: "رفع الشعار",



      no_logo: "بدون شعار",



      export_settings: "تصدير الإعدادات",



      import_settings: "استيراد الإعدادات",



      import_success: "تم استيراد الإعدادات",



      import_failed: "فشل استيراد الإعدادات",



      reset_defaults: "إرجاع الافتراضي",



      reset_done: "تمت إعادة الإعدادات الافتراضية",



      time_format: "تنسيق الوقت",



      select_time_format: "اختر تنسيق الوقت",



      week_start: "بداية الأسبوع",



      select_week_start: "اختر بداية الأسبوع",



      digest_frequency: "تكرار الإشعارات",



      select_frequency: "اختر التكرار",



      frequency_instant: "فوري",



      frequency_daily: "يومي",



      frequency_weekly: "أسبوعي",



      notifications_enabled: "تفعيل الإشعارات",



      quiet_hours_start: "بداية وقت الهدوء",



      quiet_hours_end: "نهاية وقت الهدوء",



      login_title: "تسجيل الدخول",



      register_title: "إنشاء حساب",



      username: "اسم المستخدم",



      password: "كلمة المرور",



      show: "إظهار",



      hide: "إخفاء",



      confirm_password: "تأكيد كلمة المرور",



      full_name: "الاسم الكامل",



      login: "دخول",



      logout: "تسجيل الخروج",



      register: "تسجيل",



      change_password: "تغيير كلمة المرور",



      current_password: "كلمة المرور الحالية",



      new_password: "كلمة المرور الجديدة",



      password_changed: "تم تحديث كلمة المرور",



      password_change_failed: "فشل تحديث كلمة المرور",



      remember_me: "تذكرني",



      forgot_password: "نسيت كلمة المرور؟",
      login_demo_admin: "دخول كمدير",
      login_demo_employee: "دخول كموظف",



      reset_password_title: "إعادة تعيين كلمة المرور",



      reset_password_desc: "أدخل بريدك لاستلام رابط إعادة التعيين",



      reset_password_submit: "إرسال رابط إعادة التعيين",



      reset_password_sent_title: "تحقق من بريدك",



      reset_password_sent_desc: "إذا كان البريد موجودًا، أرسلنا رابط إعادة تعيين وإرشادات الخطوات التالية",



        

      reset_password_new_title: "تعيين كلمة مرور جديدة",



      reset_password_new_desc: "أدخل كلمة مرور جديدة لحسابك",



      reset_password_new_submit: "تحديث كلمة المرور",



      reset_password_invalid_link: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية",



      reset_password_success_desc: "تم تحديث كلمة المرور بنجاح",



      have_account: "لديك حساب؟ تسجيل الدخول",



      create_account: "إنشاء حساب جديد",



      generic_error: "حدث خطأ",



      invalid_login: "بيانات الدخول غير صحيحة",
      login_locked: "محاولات كثيرة. حاول بعد دقيقة.",
      session_expired: "انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.",


      register_failed: "فشل التسجيل",






      username_required: "اسم المستخدم مطلوب",



      password_min: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",



      confirm_password_required: "تأكيد كلمة المرور مطلوب",



      passwords_not_match: "كلمة المرور والتأكيد غير متطابقين",



      not_found_title: "الصفحة غير موجودة",



      not_found_desc: "الصفحة المطلوبة غير متوفرة",



      back_home: "العودة للرئيسية",



      previous: "السابق",



      next: "التالي",



      not_authorized_title: "غير مصرح",



      not_authorized_desc: "ليس لديك صلاحية للوصول لهذه الصفحة",



      app_name: "نظام الموارد البشرية",



      app_subtitle: "إدارة الموظفين",



      main_menu: "القائمة الرئيسية",



      administration: "الإدارة",



      trend_from_last_month: "{{value}}% من الشهر الماضي",



      default_user_name: "مدير النظام",



      default_user_role: "مدير النظام",



      cancel: "إلغاء",



      save: "حفظ",



      add: "إضافة",



      approve: "اعتماد",



      reject: "رفض",



      employee_form_add_title: "إضافة موظف جديد",



      employee_form_edit_title: "تعديل بيانات الموظف",



      additional_details: "تفاصيل إضافية",



      nationality: "الجنسية",



      birth_date: "تاريخ الميلاد",



      address: "العنوان",



      salary: "الراتب",



      contract_status: "حالة العقد",



      contract_permanent: "دائم",



      contract_contract: "عقد",



      contract_probation: "فترة تجربة",



      contract_terminated: "منتهي",



      avatar: "الصورة الشخصية",



      import: "استيراد",



      import_employees_success: "تم الاستيراد",



      import_employees_success_desc: "تم إنشاء {{created}} وتحديث {{updated}}",



      attendance_summary: "ملخص الحضور",



      leaves_summary: "ملخص الإجازات",



      full_name_label: "الاسم الكامل",



      select_department: "اختر القسم",



      select_job_title: "اختر المسمى",



      status_active: "نشط",



      status_on_leave: "إجازة",



      status_inactive: "غير نشط",



      name_required: "الاسم مطلوب",



      email_invalid: "البريد الإلكتروني غير صحيح",



      phone_invalid: "رقم الهاتف غير صحيح",



      department_required: "القسم مطلوب",



      job_title_required: "المسمى الوظيفي مطلوب",



      hire_date_required: "تاريخ التعيين مطلوب",



      leave_form_add_title: "طلب إجازة جديد",



      leave_form_edit_title: "تعديل طلب الإجازة",



      leave_type_label: "نوع الإجازة",



      select_leave_type: "اختر نوع الإجازة",



      from_date: "من تاريخ",



      to_date: "إلى تاريخ",



      reason: "السبب",



      leave_reason_placeholder: "اذكر سبب الإجازة...",



      send_request: "إرسال الطلب",



      leave_type_required: "نوع الإجازة مطلوب",



      start_date_required: "تاريخ البداية مطلوب",



      end_date_required: "تاريخ النهاية مطلوب",



      end_after_start: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",



      employee_required: "الموظف مطلوب",



      select_employee: "اختر الموظف",



      attachments: "المرفقات",



      approval_log: "سجل الاعتمادات",



      attendance_title: "الحضور والانصراف",



      attendance_subtitle: "متابعة سجلات الحضور والانصراف للموظفين",



      date: "التاريخ",



      add_attendance: "إضافة حضور",



      attendance_form_add_title: "إضافة سجل حضور",



      attendance_form_edit_title: "تعديل سجل حضور",



      attendance_added: "تمت الإضافة",



      attendance_added_desc: "تم إضافة سجل الحضور بنجاح",



      attendance_updated: "تم التحديث",



      attendance_updated_desc: "تم تحديث سجل الحضور بنجاح",



      attendance_deleted: "تم الحذف",



      attendance_deleted_desc: "تم حذف سجل الحضور بنجاح",



      delete_attendance_title: "حذف السجل",



      delete_attendance_desc: "هل أنت متأكد من حذف هذا السجل؟",



      date_required: "التاريخ مطلوب",



      status_required: "الحالة مطلوبة",



      invalid_time_range: "وقت الانصراف يجب أن يكون بعد وقت الحضور",



      close_day: "إغلاق اليوم",



      attendance_closed: "تم إغلاق اليوم",



      attendance_closed_desc: "تم تحديث {{count}} سجل(ات)",



      sync_devices: "مزامنة الأجهزة",



      import_logs: "استيراد السجلات",



      attendance_imported: "تم الاستيراد بنجاح",



      today: "اليوم",



      export_pdf: "تصدير PDF",



      search_by_name_or_id: "بحث بالاسم أو رقم الموظف...",



      status_filter: "الحالة",



      status_all: "الكل",



      status_present: "حاضر",



      status_absent: "غائب",



      status_late: "متأخر",



      more: "المزيد",



      attendance_record: "سجل الحضور",



      employee_name: "اسم الموظف",



      check_in_time: "وقت الحضور",



      check_out_time: "وقت الانصراف",



      work_hours: "ساعات العمل",



      late_count: "المتأخرون",



      leaves_title: "إدارة الإجازات",



      leaves_subtitle: "طلبات الإجازات وأرصدة الموظفين",



      new_leave_request: "طلب إجازة جديد",



      total_balance: "الرصيد الكلي",



      used_balance: "المستخدم",



      remaining_balance: "المتبقي",



      leave_requests_title: "طلبات الإجازات",



      days_count: "عدد الأيام",



      days: "يوم",



      approved: "معتمدة",



      rejected: "مرفوضة",



      pending: "قيد المراجعة",



      leave_deleted: "تم الحذف",



      leave_deleted_desc: "تم حذف طلب الإجازة بنجاح",



      leave_added: "تمت الإضافة",



      leave_added_desc: "تم إضافة طلب الإجازة بنجاح",



      leave_updated: "تم التعديل",



      leave_updated_desc: "تم تعديل طلب الإجازة بنجاح",



      delete_leave_title: "حذف طلب الإجازة",



      delete_leave_desc:



        "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.",



      leave_details_title: "طلب إجازة",



      devices_title: "أجهزة البصمة",



      devices_subtitle: "إدارة ومراقبة أجهزة تسجيل الحضور",



      add_device: "إضافة جهاز",



      total_devices: "إجمالي الأجهزة",



      online: "متصل",



      offline: "غير متصل",



      devices_list: "قائمة الأجهزة",



      device_name: "اسم الجهاز",



      serial_number: "الرقم التسلسلي",



      ip_address: "عنوان IP",



      location: "الموقع",



      last_sync: "آخر مزامنة",



      last_seen: "آخر اتصال",



      device_settings: "إعدادات الجهاز",



      sync_now: "مزامنة الآن",



      sync_logs: "سجل المزامنة",



      sync_success: "تمت المزامنة",



      sync_failed: "فشلت المزامنة",



      device_name_required: "اسم الجهاز مطلوب",



      serial_required: "الرقم التسلسلي مطلوب",



      invalid_ip: "عنوان IP غير صحيح",



      location_required: "الموقع مطلوب",



      employee_count: "عدد الموظفين المسجلين",



      device_deleted: "تم حذف الجهاز",



      device_deleted_desc: 'تم حذف الجهاز "{{name}}" بنجاح',



      device_updated: "تم تحديث الجهاز",



      device_updated_desc: "تم تعديل بيانات الجهاز بنجاح",



      device_added: "تمت الإضافة",



      device_added_desc: "تم إضافة الجهاز بنجاح",



      delete_device_title: "حذف الجهاز",



      delete_device_desc:



        'هل أنت متأكد من حذف "{{name}}"؟ لا يمكن التراجع عن هذا الإجراء.',



      job_titles_title: "المسميات الوظيفية",



      job_titles_subtitle: "إدارة المسميات والدرجات الوظيفية",



      add_job_title: "إضافة مسمى",



      job_titles_list: "قائمة المسميات الوظيفية",



      level_required: "المستوى مطلوب",



      min_salary_required: "الحد الأدنى للراتب مطلوب",



      max_salary_required: "الحد الأعلى للراتب مطلوب",



      salary_range_invalid: "الحد الأعلى يجب أن يكون أكبر من أو يساوي الأدنى",



      cannot_delete_job_title: "لا يمكن حذف المسمى الوظيفي",



      job_delete_has_employees: "هذا المسمى مرتبط بموظفين",






      select_level: "اختر المستوى",



      job_title_ar: "المسمى (عربي)",



      job_title_en: "المسمى (إنجليزي)",



      level: "المستوى",



      salary_range: "نطاق الراتب",



      min_salary: "الحد الأدنى للراتب",



      max_salary: "الحد الأقصى للراتب",



      job_description: "الوصف الوظيفي",



      delete_job_title: "حذف المسمى الوظيفي",



      delete_job_title_desc:



        'هل أنت متأكد من حذف "{{name}}"؟ لا يمكن التراجع عن هذا الإجراء.',



      job_deleted: "تم حذف المسمى الوظيفي",



      job_deleted_desc: 'تم حذف المسمى الوظيفي "{{name}}" بنجاح',



      job_updated: "تم تحديث المسمى الوظيفي",



      job_updated_desc: "تم تعديل المسمى الوظيفي بنجاح",



      job_added: "تمت الإضافة",



      job_added_desc: "تم إضافة المسمى الوظيفي بنجاح",



      users_title: "المستخدمين",



      users_subtitle: "إدارة مستخدمي النظام والصلاحيات",



      add_user: "إضافة مستخدم",



      total_users: "إجمالي المستخدمين",



      system_admins: "مدراء النظام",



      users_list: "قائمة المستخدمين",



      username_taken: "اسم المستخدم موجود بالفعل",



      cannot_delete_self: "لا يمكنك حذف حسابك",



      cannot_change_own_role: "لا يمكنك تغيير دورك",



      force_password_change: "إجبار تغيير كلمة المرور",



      force_password_change_desc: "إلزام التغيير عند أول دخول",



      role_permissions_hint: "الصلاحيات مشتقة من الدور",



      use_role_permissions: "استخدام صلاحيات الدور",



      user: "المستخدم",



      role: "الدور",



      last_login: "آخر تسجيل دخول",



      perm_employees: "إدارة الموظفين",



      perm_attendance: "الحضور والانصراف",



      perm_leaves: "إدارة الإجازات",



      perm_reports: "التقارير",



      perm_structure: "الهيكل التنظيمي",



      perm_devices: "الأجهزة",



      perm_payroll: "الرواتب",



      perm_recruitment: "التوظيف",



      perm_performance: "الأداء",



      perm_training: "التدريب",



      perm_assets: "الأصول",



      perm_settings: "الإعدادات",



      perm_users: "إدارة المستخدمين",



      perm_self_service: "الخدمة الذاتية",



      permissions: "الصلاحيات",
      permissions_select_all: "تحديد الكل",
      permissions_clear_all: "إزالة الكل",



      select_role: "اختر الدور",



      user_deleted: "تم الحذف",



      user_deleted_desc: 'تم حذف المستخدم "{{name}}" بنجاح',



      user_updated: "تم تحديث المستخدم",



      user_updated_desc: "تم تعديل بيانات المستخدم بنجاح",



      user_added: "تمت الإضافة",



      user_added_desc: "تم إضافة المستخدم بنجاح",



      delete_user_title: "حذف المستخدم",



      delete_user_desc:



        'هل أنت متأكد من حذف المستخدم "{{name}}"؟ لا يمكن التراجع عن هذا الإجراء.',



      structure_title: "الهيكل الإداري",



      structure_subtitle: "إدارة الأقسام والإدارات",



      add_department: "إضافة قسم",



      department_tree: "شجرة الأقسام",



      no_departments: "لا توجد أقسام",



      start_by_adding_department: "ابدأ بإضافة أول قسم في الهيكل الإداري",



      delete_department_title: "حذف القسم",



      delete_department_desc:



        'هل أنت متأكد من حذف القسم "{{name}}"؟ سيتم حذف جميع الأقسام الفرعية أيضًا.',



      department_deleted: "تم حذف القسم",



      department_deleted_desc: 'تم حذف القسم "{{name}}" بنجاح',



      department_updated: "تم تحديث القسم",



      department_added: "تم إضافة القسم",



      department_updated_desc: 'تم تحديث القسم "{{name}}" بنجاح',



      department_added_desc: 'تم إضافة القسم "{{name}}" بنجاح',



      department_name: "اسم القسم",



      department_manager: "مدير القسم",



      parent_department: "القسم الأب",



      parent_none: "بدون (قسم رئيسي)",



      select_manager: "اختر المدير",



      none: "بدون",



      manager_label: "المدير",



      add_sub_department: "إضافة قسم فرعي",



      edit_department: "تعديل القسم",



      drag_to_reorder: "اسحب لترتيب الأقسام",



      order_saved: "تم حفظ الترتيب",



      department_parent_invalid: "القسم الأب غير صالح",



      cannot_move_into_child: "لا يمكن نقل القسم داخل قسم فرعي منه",



      leave_type_annual: "سنوية",



      leave_type_sick: "مرضية",



      leave_type_emergency: "طارئة",



      leave_type_unpaid: "بدون راتب",



      role_system_admin: "مدير النظام",



      role_hr_manager: "مدير موارد بشرية",



      role_supervisor: "مشرف",



      role_employee: "موظف",



      dept_top_management: "الإدارة العليا",






      dept_hr_full: "الموارد البشرية",



      dept_it: "تقنية المعلومات",



      dept_finance: "المالية",






      level_executive: "تنفيذي",



      level_manager: "إداري",



      level_specialist: "متخصص",



      level_junior: "مبتدئ",
      level_senior: "متقدم",
      level_mid: "متوسط",



      job_title_manager: "مدير قسم",



      job_title_hr_manager: "مدير موارد بشرية",



      job_title_hr_specialist: "أخصائي موارد بشرية",



      job_title_software_dev: "مطور برمجيات",



      job_title_sales_rep: "مندوب مبيعات",



      job_title_accountant: "محاسب",



      sample_person_ahmed_mohammed_ali: "أحمد محمد علي",



      sample_person_sara_ahmed_hassan: "سارة أحمد حسن",



      sample_person_mohammed_khaled_omar: "محمد خالد عمر",



      sample_person_fatima_ali_mahmoud: "فاطمة علي محمود",



      sample_person_abdullah_saeed: "عبدالله سعيد",



      sample_person_ahmed_mohammed: "أحمد محمد",



      sample_person_sara_ali: "سارة علي",



      sample_person_mohammed_khaled: "محمد خالد",



      sample_person_fatima_hassan: "فاطمة حسن",



      sample_person_noura_saad: "نورة سعد",



      sample_person_ali_hassan: "علي حسن",



      sample_person_fahd_ahmed: "فهد أحمد",



      sample_person_fatima_abdullah: "فاطمة عبدالله",



      sample_reason_family_leave: "إجازة عائلية",



      sample_reason_sick: "مرض",



      sample_reason_personal: "ظروف شخصية",



      sample_reason_travel: "سفر",



      dept_recruitment: "التوظيف",



      dept_training: "التدريب والتطوير",



      dept_software: "تطوير البرمجيات",



      dept_support: "الدعم الفني",



      job_desc_general_manager: "مسؤول عن الإدارة العامة للمؤسسة",



      job_desc_hr_manager: "إدارة شؤون الموظفين والتوظيف",



      job_desc_hr_specialist: "تنفيذ سياسات الموارد البشرية",



      job_desc_senior_dev: "تطوير وبرمجة التطبيقات",



      job_desc_software_dev: "المشاركة في تطوير البرمجيات",



      job_desc_accountant: "إدارة الحسابات والقيود المالية",



      sample_attendance_date: "15 يناير 2024",



      job_title_general_manager: "مدير عام",



      job_title_senior_dev: "مطور برمجيات أول",



      company_name_example: "شركة المثال للتقنية",



      company_address_example: "الرياض، المملكة العربية السعودية",



      time_0830_am: "08:30 ص",



      time_0915_am: "09:15 ص",



      time_0500_pm: "05:00 م",



      time_1030_am: "10:30 ص",



      timezone_riyadh: "الرياض (GMT+3)",



      timezone_dubai: "دبي (GMT+4)",



      timezone_cairo: "القاهرة (GMT+2)",



      self_service_title: "الخدمة الذاتية",



      self_service_subtitle: "إدارة الملف الشخصي والحضور وطلبات الإجازة",



      my_profile: "ملفي الشخصي",



      my_attendance: "حضوري",



      my_leaves: "إجازاتي",



      my_documents: "مستنداتي",
      self_service_balances: "أرصدة الإجازات",
      self_service_approvals: "الموافقات",
      self_service_payroll: "قسائم الرواتب",
      status_read: "\u0645\u0642\u0631\u0648\u0621",
      status_unread: "\u063a\u064a\u0631 \u0645\u0642\u0631\u0648\u0621",
      mark_read: "\u062a\u0639\u0644\u064a\u0645 \u0643\u0645\u0642\u0631\u0648\u0621",
      mark_all_read: "\u062a\u0639\u0644\u064a\u0645 \u0627\u0644\u0643\u0644 \u0643\u0645\u0642\u0631\u0648\u0621",
      self_service_assets: "أصولي",
      self_service_training: "التدريب",
      self_service_performance: "التقييم",
      self_service_notifications: "الإشعارات",
      self_service_security: "الأمان",



      request_leave: "طلب إجازة",



      documents: "المستندات",



      document_title: "عنوان المستند",



      document_type: "نوع المستند",



      document_uploaded: "تم رفع المستند",



      document_uploaded_desc: "تم رفع المستند بنجاح",



      document_deleted: "تم حذف المستند",



      document_deleted_desc: "تم حذف المستند بنجاح",



      no_documents: "لا توجد مستندات",



      notes: "ملاحظات",



      upload: "رفع",



      reports_title: "التقارير",



      reports_subtitle: "إنشاء تقارير الموارد البشرية",
      report_type_attendance: "الحضور",
      report_type_leaves: "الإجازات",
      report_type_payroll: "الرواتب",
      report_type_recruitment: "التوظيف",
      report_type_performance: "الأداء",
      report_type_training: "التدريب",
      report_type_assets: "الأصول",
      report_type_discipline: "الانضباط",
      generate_report: "إنشاء التقرير",
      generate_report_hint: "ولّد تقريرًا لعرض البيانات هنا.",
      export_csv: "تصدير CSV",
      export_excel: "تصدير Excel",



      generate_reports: "إنشاء التقارير",



      attendance_report_title: "تقرير الحضور",



      leave_report_title: "تقرير الإجازات",



      records_count: "عدد السجلات: {{count}}",



      action: "الإجراء",



      model: "النموذج",



      object_id: "معرّف العنصر",



      create: "إنشاء",



      update: "تحديث",



      audit_logs_title: "سجل التدقيق",



      audit_logs_subtitle: "تتبع تغييرات النظام",



      payroll_title: "الرواتب",



      payroll_subtitle: "إدارة سجلات الرواتب",



      payroll_records: "سجلات الرواتب",



      base_salary: "الراتب الأساسي",



      allowances: "البدلات",



      deductions: "الاستقطاعات",
      net_salary: "صافي الراتب",



      status_draft: "مسودة",



      status_paid: "مدفوع",



      recruitment_title: "التوظيف",



      recruitment_subtitle: "إدارة المرشحين ومسار التوظيف",



      recruitment_candidates: "المرشحون",



      position: "الوظيفة",



      source: "المصدر",



      candidate_status_applied: "متقدم",



      candidate_status_screening: "فرز",



      candidate_status_interview: "مقابلة",



      candidate_status_offered: "عرض",



      candidate_status_hired: "تم التوظيف",



      candidate_status_rejected: "مرفوض",



      performance_title: "الأداء",



      performance_subtitle: "مراجعات أداء الموظفين",



      performance_reviews: "مراجعات الأداء",



      period: "الفترة",



      rating: "التقييم",



      training_title: "التدريب",



      training_subtitle: "سجلات تدريب الموظفين",



      training_records: "سجلات التدريب",



      title: "العنوان",



      provider: "الجهة",



      training_status_planned: "مخطط",



      training_status_in_progress: "قيد التنفيذ",



      training_status_completed: "مكتمل",



      training_status_cancelled: "ملغى",



      assets_title: "الأصول",



      assets_subtitle: "إدارة أصول الشركة",



      assets_list: "قائمة الأصول",



      asset_name: "اسم الأصل",



      category: "الفئة",



      assigned_to: "مسند إلى",



      asset_status_available: "متاح",



      asset_status_assigned: "مسند",



      asset_status_maintenance: "صيانة",



      asset_status_retired: "مستبعد",



      approval_levels: "مستويات الموافقة",



      approval_level_1: "مستوى واحد",



      approval_level_2: "مستويان",
      role_admin: "مدير",
      company_name_en_example: "شركة تقنية مثالية",
      tpl_leave_request_body_no_var: "تم استلام طلب إجازة جديد.",
      tpl_leave_request_sms_no_var: "تم استلام طلب إجازة جديد.",
      tpl_leave_approved_body_no_var: "تم اعتماد الإجازة.",
      tpl_leave_approved_sms_no_var: "تم اعتماد الإجازة.",
      tpl_leave_rejected_body_no_var: "تم رفض الإجازة.",
      tpl_leave_rejected_sms_no_var: "تم رفض الإجازة.",
      tpl_attendance_alert_body_no_var: "تنبيه حضور.",
      tpl_attendance_alert_sms_no_var: "تنبيه حضور.",
      tpl_weekly_report_body_no_var: "الملخّص الأسبوعي جاهز.",
      tpl_weekly_report_sms_no_var: "التقرير الأسبوعي جاهز.",
      template_hint_no_var: "لا يستخدم القالب متغيرات.",
      tpl_leave_request_subject: "طلب إجازة جديد",
      tpl_leave_request_body: "تم تقديم طلب إجازة لـ {{employee}}.",
      tpl_leave_request_sms: "طلب إجازة لـ {{employee}}.",
      tpl_leave_approved_subject: "تم اعتماد الإجازة",
      tpl_leave_approved_body: "تم اعتماد إجازة {{employee}}.",
      tpl_leave_approved_sms: "تم اعتماد إجازة {{employee}}.",
      tpl_leave_rejected_subject: "تم رفض الإجازة",
      tpl_leave_rejected_body: "تم رفض إجازة {{employee}}.",
      tpl_leave_rejected_sms: "تم رفض إجازة {{employee}}.",
      tpl_attendance_alert_subject: "تنبيه حضور",
      tpl_attendance_alert_body: "تنبيه حضور لـ {{employee}}.",
      tpl_attendance_alert_sms: "تنبيه حضور لـ {{employee}}.",
      tpl_weekly_report_subject: "تقرير أسبوعي للموارد البشرية",
      tpl_weekly_report_body: "الملخّص الأسبوعي جاهز.",
      tpl_weekly_report_sms: "التقرير الأسبوعي جاهز.",



    },



  },



};







i18n



  .use(LanguageDetector)



  .use(initReactI18next)



  .init({



    resources,



    lng: "ar",



    fallbackLng: "en",



    interpolation: {



      escapeValue: false,



    },



  });







export default i18n;
