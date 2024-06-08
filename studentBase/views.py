from .google_services.services import get_all_ids, get_all_students
from .google_services.update_gsheet import row_range
from django.db.models import Q
from django.shortcuts import render, redirect
from .models import Profile
from .forms import UpdateForm
from .google_services.update_gsheet import data_org

from .constants import SHEET_NAME


def home(request):
    student_search = request.GET.get('Student_ID')
    if student_search is None:
        student_search = ''
    else: student_search = student_search.lower()

    students = Profile.objects.filter(
        Q(First_Name__icontains=student_search)|
        Q(Student_ID__icontains=student_search)|
        Q(Last_Name__icontains=student_search)|
        Q(Middle_Name__icontains=student_search)
    )



    context = {'students': students}
    return render(request, 'studentBase/home.html',context)

def profile(request,id):
    student = Profile.objects.get(Student_ID=id)
    fields = student._meta.fields
    fields = [field.name for field in fields]
    student_data = {}
    exceptions = ['Photo','Schedule','id','Social_Media','Address']
    for field in fields:
        if field not in exceptions:
            student_data[field] = getattr(student,field)
    context = {'student_data':student_data,'student':student}
    return render(request,'studentBase/profile.html',context)



def update_profile(request,id):
    _,worksheet = get_all_students(SHEET_NAME)
    student = Profile.objects.get(Student_ID=id)

    if request.method == 'POST':
        form = UpdateForm(request.POST, instance=student)

        if form.is_valid():
            new_id = int(request.POST.get('Student_ID'))
            id_list = get_all_ids(SHEET_NAME)
            row = id_list.index(id)+2
            form = dict(request.POST)
            gsheet_range = row_range(row)
            new_data = data_org(form)
            worksheet.update(gsheet_range,[new_data])

            return redirect('home',)



    student = Profile.objects.get(Student_ID=id)

    form = UpdateForm(instance=student)
    for field in form:
        print(field.label)
    context = {'form':form,'student':student}
    return render(request,'studentBase/profile_update.html',context)


