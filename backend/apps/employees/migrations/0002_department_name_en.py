from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("employees", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="department",
            name="name_en",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
