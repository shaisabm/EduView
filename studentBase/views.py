import os
import smtplib
import time
from .google_services.services import get_all_ids, get_all_students
from .google_services.update_gsheet import row_range
from django.db.models import Q
from django.shortcuts import render, redirect
from .models import Profile
from .forms import UpdateForm, RegisterForm
from .google_services.update_gsheet import data_org
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .constants import SHEET_NAME
from django.contrib import messages
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from .tokens import token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.http import HttpResponse
from .models import User
from django.contrib.auth.decorators import user_passes_test



def teacher_login(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        username = request.POST.get('username').lower()
        password = request.POST.get('password')
        try:
            user = User.objects.get(username=username)
        except: messages.error(request,'Teacher not found')
        user = authenticate(request,username=username,password=password)

        if user is not None:
            login(request,user)
            return redirect('home')
        else:messages.error(request,'Incorrect password')

    return render(request,'studentBase/login.html',)


def teacher_register(request):
    if request.user.is_authenticated:
        return redirect('home')
    form = RegisterForm
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            teacher = form.save(commit=False)
            teacher.email,  teacher.username = teacher.email.lower(), teacher.username.lower()
            teacher.is_active = False
            teacher.save()
            current_site = get_current_site(request)
            message = render_to_string('studentBase/account_activation.html',{
                'domain':current_site,
                'token': token_generator.make_token(teacher),
                'uid': urlsafe_base64_encode(force_bytes(teacher.pk)),
                'teacher':teacher

            })
            client_email = request.POST.get('email')
            send_mail(
                subject='Verify your email for EduView',
                recipient_list=[client_email],
                message=message,
                from_email=os.environ.get('FROM_EMAIL')
            )
            messages.success(request,'An verification email has been sent to your email')

        elif User.objects.filter(username=request.POST.get('username').lower()).exists():
            messages.error(request, 'Username taken. Please try a different username.')
        else: messages.error(request, 'An unknown error has occurred!')

    context = {'form':form}
    return render(request, 'studentBase/register.html', context)


def activate(request, uid, token):
    try:
        uid_decoded = force_bytes(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=uid_decoded)
    except: user = None

    if user is not None and user.is_active:
        login(request,user)
        return redirect('login')

    elif user is not None and token_generator.check_token(user,token):
        user.is_active = True
        user.save()
        message = 'Your email has been successfully verified!'
    else:
        message = 'The link is either invalid or expired. Please register again'

    context = {'message':message}
    return render(request,'studentBase/account_activation.html', context)



@login_required(login_url='login')
def teacher_logout(request):
    logout(request)
    return redirect('login')


# def teacher(user):
#     return user.is_teacher
@login_required(login_url='login')
# @user_passes_test(teacher) # set a redirect url to student dashboard
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
@login_required(login_url='login')
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


@login_required(login_url='login')
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
    return render(request, 'studentBase/profile_update.html', context)

@login_required(login_url='login')
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



