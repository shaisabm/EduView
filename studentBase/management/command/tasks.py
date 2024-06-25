from studentBase.models import Profile
from studentBase.google_services.services import get_all_students, get_all_ids
from studentBase.views import SHEET_NAME


def sync_from_sheet_to_profile():
    try:
        students,_ = get_all_students(SHEET_NAME)
        student_ids = get_all_ids(SHEET_NAME)
        for student in students:
            student_id = student['Student_ID']
            if type(student_id) == int:
                Profile.objects.update_or_create(
                    Student_ID=student['Student_ID'],
                    defaults=student
                )


        for object in Profile.objects.all():
            if object.Student_ID not in student_ids:
                object.delete()

    except: print('Maximum api request exceed')








