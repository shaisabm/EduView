from studentBase.models import Profile
from studentBase.google_services.services import get_all_students, get_all_ids



def sync_from_sheet_to_profile():
    students,_ = get_all_students('Students')
    student_ids = get_all_ids('Students')

    for student in students:
        student_id = student['Student_ID']
        if type(student_id) == int:
            Profile.objects.update_or_create(
                Student_ID=student['Student_ID'],

                defaults={
                    'First_Name':student['First_Name'],
                    'Middle_Name':student['Middle_Name'],
                    'Last_Name':student['Last_Name'],
                    'Photo':student['Photo'],
                    'Grade':student['Grade'],
                    'Schedule':student['Schedule'],
                    'Social_Media':student['Social_Media'],
                    'Address':student['Address'],
                    'Email':student['Email'],
                    'Contact_1':student['Contact_1'],
                    'Contact_2': student['Contact_2']


                }
            )


    for object in Profile.objects.all():
        if object.Student_ID not in student_ids:
            object.delete()







