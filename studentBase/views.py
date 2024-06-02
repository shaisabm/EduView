from .google_services.services import get_all_ids, get_all_students
from .google_services.update_gsheet import row_range
from django.db.models import Q
from django.shortcuts import render, redirect
from .models import Profile
from .forms import UpdateForm
from .google_services.update_gsheet import data_org


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

    return render(request,'studentBase/profile.html',{'student':student})



def update_profile(request,id):
    _,worksheet = get_all_students('Students')
    student = Profile.objects.get(Student_ID=id)

    if request.method == 'POST':
        form = UpdateForm(request.POST, instance=student)

        if form.is_valid():
            new_id = int(request.POST.get('Student_ID'))
            id_list = get_all_ids('Students')
            row = id_list.index(id)+2
            form = dict(request.POST)
            gsheet_range = row_range(row)
            new_data = data_org(form)
            worksheet.update(gsheet_range,[new_data])

            return redirect('home',)



    student = Profile.objects.get(Student_ID=id)
    form = UpdateForm(instance=student)
    context = {'form':form,'student':student}
    return render(request,'studentBase/profile_update.html',context)


