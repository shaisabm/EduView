# Generated by Django 4.2.13 on 2024-06-26 17:28

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("studentBase", "0009_alter_message_options_message_reply_to"),
    ]

    operations = [
        migrations.AlterField(
            model_name="message",
            name="reply_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="replay_to",
                to="studentBase.message",
            ),
        ),
    ]
