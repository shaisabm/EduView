from apscheduler.schedulers.background import BackgroundScheduler
from .tasks import sync_from_sheet_to_profile


def start():
    scheduler = BackgroundScheduler()
    scheduler.add_job(sync_from_sheet_to_profile,'interval',seconds = 30)
    scheduler.start()