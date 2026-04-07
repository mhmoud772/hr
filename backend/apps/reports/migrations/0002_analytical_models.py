# Generated manually to resolve refactoring conflicts.
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('reports', '0001_initial'),
    ]
    operations = [
        migrations.CreateModel(
            name='DailyDashboardSnapshot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(unique=True)),
                ('total_employees', models.IntegerField(default=0)),
                ('present_today', models.IntegerField(default=0)),
                ('absent_today', models.IntegerField(default=0)),
                ('pending_leaves', models.IntegerField(default=0)),
                ('critical_leaves', models.IntegerField(default=0)),
                ('adherence_rate', models.FloatField(default=0.0)),
                ('average_late_minutes', models.FloatField(default=0.0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='DepartmentDistributionSnapshot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('department_name', models.CharField(max_length=255)),
                ('employee_count', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-date', '-employee_count'],
                'unique_together': {('date', 'department_name')},
            },
        ),
        migrations.CreateModel(
            name='SystemActivityFact',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('activity_id', models.CharField(max_length=255, unique=True)),
                ('employee_name', models.CharField(max_length=255)),
                ('action', models.CharField(max_length=255)),
                ('time', models.DateTimeField()),
                ('activity_type', models.CharField(max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-time'],
                'indexes': [models.Index(fields=['date', '-time'], name='idx_activity_date_time')],
            },
        ),
    ]
