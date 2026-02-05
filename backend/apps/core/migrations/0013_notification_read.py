from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0012_hr_modules"),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationRead",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("read_at", models.DateTimeField(auto_now_add=True)),
                ("notification", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="reads", to="core.notification")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="notification_reads", to="core.user")),
            ],
            options={
                "unique_together": {("notification", "user")},
            },
        ),
    ]
