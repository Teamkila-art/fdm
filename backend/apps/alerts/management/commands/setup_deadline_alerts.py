"""Register the check_marche_deadlines periodic task in django-celery-beat."""

from django.core.management.base import BaseCommand
from django_celery_beat.models import IntervalSchedule, PeriodicTask


class Command(BaseCommand):
    help = "Ensure the check_marche_deadlines task runs daily via celery-beat."

    def handle(self, *args, **options):
        schedule, _ = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.DAYS,
        )

        task, created = PeriodicTask.objects.get_or_create(
            name="Check marché / BC delivery deadlines",
            defaults={
                "task": "apps.alerts.tasks.check_marche_deadlines",
                "interval": schedule,
                "enabled": True,
            },
        )

        if created:
            self.stdout.write(self.style.SUCCESS(
                "Periodic task 'check_marche_deadlines' created (runs daily)."
            ))
        else:
            # Ensure it's enabled and points to the right task
            task.task = "apps.alerts.tasks.check_marche_deadlines"
            task.interval = schedule
            task.enabled = True
            task.save(update_fields=["task", "interval", "enabled"])
            self.stdout.write(self.style.SUCCESS(
                "Periodic task 'check_marche_deadlines' already exists — updated."
            ))
