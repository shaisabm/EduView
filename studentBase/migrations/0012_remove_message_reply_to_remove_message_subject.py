# Generated by Django 4.2.13 on 2024-07-03 03:44

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("studentBase", "0011_message_subject"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="message",
            name="reply_to",
        ),
        migrations.RemoveField(
            model_name="message",
            name="subject",
        ),
    ]
