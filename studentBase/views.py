from .google_services.services import get_all_ids, get_all_students
from .google_services.update_gsheet import row_range
from django.db.models import Q
from django.shortcuts import render, redirect
from .models import Profile
from .forms import UpdateForm
from .google_services.update_gsheet import data_org
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from .constants import SHEET_NAME

def teacher_login(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        try:
            user = User.objects.get(username=username)
        except: messages.error(request,'Teacher not found')
        user = authenticate(request,username=username,password=password)
        print(user)
        if user is not None:
            login(request,user)
            messages.success(request,'Successfully logged in')
            return redirect('home')




    return render(request,'studentBase/login.html',)

@login_required(login_url='teacher_login')
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

    # _, worksheet = get_all_students(SHEET_NAME)
    # worksheet.delete_rows(7,7)



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
    context = {'form':form,'student':student}
    return render(request,'studentBase/profile_update.html',context)

def delete_student(request,id):
    _,worksheet = get_all_students(SHEET_NAME)
    student = Profile.objects.get(Student_ID=id)
    if request.method == "POST":
        student_records = worksheet.get_all_records()
        for s in range(len(student_records)):
            Student_ID = student_records[s]['Student_ID']
            if Student_ID == id:
                row = s+2
                worksheet.delete_rows(row,row)
                return redirect('home')



    context = {'student':student}
    return render(request,'studentBase/delete_student.html',context)



