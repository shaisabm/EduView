from django.apps import AppConfig


class StudentbaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'studentBase'

    def ready(self):
        from .management.command import task_runner
        task_runner.start()

