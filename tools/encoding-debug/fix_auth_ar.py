import re, pathlib
path=pathlib.Path('frontend/src/i18n.ts')
text=path.read_text(encoding='utf8')
patterns={
    'login_title': 'تسجيل الدخول',
    'login': 'تسجيل الدخول',
    'logout': 'تسجيل الخروج',
    'register_title': 'إنشاء حساب',
    'register': 'تسجيل',
    'username': 'اسم المستخدم',
    'password': 'كلمة المرور',
    'remember_me': 'تذكرني',
    'forgot_password': 'نسيت كلمة المرور؟',
    'invalid_login': 'بيانات الدخول غير صحيحة',
    'login_locked': 'تم إقفال الدخول مؤقتًا بسبب محاولات متكررة',
    'password_min': 'كلمة المرور قصيرة جدًا',
    'username_required': 'اسم المستخدم مطلوب',
    'password_min_length': 'الحد الأدنى لطول كلمة المرور',
}
for key, ar in patterns.items():
    text = re.sub(rf"({re.escape(key)}:\s*)\"[^\"]*\"", rf"\1\"{ar}\"", text, count=1)
path.write_text(text, encoding='utf8')
print('done')
