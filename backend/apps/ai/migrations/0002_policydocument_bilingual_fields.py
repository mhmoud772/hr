from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ai", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="policydocument",
            name="title_en",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="policydocument",
            name="content_en",
            field=models.TextField(blank=True, help_text="Optional English translation of the policy"),
        ),
    ]
