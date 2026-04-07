# Generated manually to resolve refactoring conflicts.
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='Settings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company_settings', models.JSONField(blank=True, default=dict)),
                ('attendance_settings', models.JSONField(blank=True, default=dict)),
                ('leave_settings', models.JSONField(blank=True, default=dict)),
                ('notification_settings', models.JSONField(blank=True, default=dict)),
                ('general_settings', models.JSONField(blank=True, default=dict)),
                ('theme_settings', models.JSONField(blank=True, default=dict)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name_plural': 'Settings',
                'db_table': 'core_settings',
            },
        ),
    ]
