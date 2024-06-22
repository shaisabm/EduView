from .google_services.services import get_all_ids, get_all_students
from .google_services.update_gsheet import row_range
from django.db.models import Q
from django.shortcuts import render, redirect
from .models import Profile
from .forms import UpdateForm, TeacherProfileForm
from .google_services.update_gsheet import data_org
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .constants import SHEET_NAME
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes, force_str
from .tokens import account_activation_token
from django.core.mail import EmailMessage
from django.contrib import messages
from django.contrib.auth import get_user_model

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
            messages.success(request,'Successfully logged in')
            return redirect('home')

    return render(request,'studentBase/login.html',)


def teacher_register(request):
    form = TeacherProfileForm
    if request.method == 'POST':
        form = TeacherProfileForm(request.POST)
        if form.is_valid():
            teacher = form.save(commit=False)
            teacher.is_active = False
            teacher.save()
            current_site = get_current_site(request)
            mail_subject = 'Activate your EduView account'
            message = render_to_string("studentBase/account_activation.html", {
                'teacher':teacher,
                'domain':current_site,
                'uid': urlsafe_base64_encode(force_bytes(teacher.pk)),
                'token': account_activation_token.make_token(teacher)

            })

            to_email = form.cleaned_data.get('email')
            email = EmailMessage(
                mail_subject, message, to=[to_email]
            )
            email.send()
            messages.success(request, 'Please check your email to complete registration')




    context = {'form':form}
    return render(request, 'studentBase/teacher_register.html',context)
def activate(request,uid64, token):
    User = get_user_model()
    try:
        uid = force_str(urlsafe_base64_decode(uid64))
        user = User.objects.get(pk=uid)
    except: user = None

    if user is not None and account_activation_token.check_token(user,token):
        user.is_active = True
        user.save()
        messages.success(request, 'Please wait until the admin give you approval')

    else:
        messages.error(request, 'Activation link is invalid or expired')
    return redirect('teacher_register')





@login_required(login_url='teacher_login')
def teacher_logout(request):
    logout(request)
    return redirect('teacher_login')

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





    context = {'students': students}
    return render(request, 'studentBase/home.html',context)
@login_required(login_url='teacher_login')
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


@login_required(login_url='teacher_login')
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

@login_required(login_url='teacher_login')
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



