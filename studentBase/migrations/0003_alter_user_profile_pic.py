# Generated by Django 4.2.13 on 2024-06-23 01:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studentBase", "0002_alter_user_profile_pic"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="profile_pic",
            field=models.ImageField(
                default="static/media/default-avatar.jpg", upload_to=""
            ),
        ),
    ]
