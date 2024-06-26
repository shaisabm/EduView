import os

from .google_services.services import get_all_ids, get_all_students
from .google_services.update_gsheet import row_range
from django.db.models import Q
from django.shortcuts import render, redirect
from .models import Profile
from .forms import UpdateForm, RegisterForm, UpdateUserForm
from .google_services.update_gsheet import data_org
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .constants import SHEET_NAME
from django.contrib import messages
from django.template.loader import render_to_string
from django.contrib.sites.shortcuts import get_current_site
from .tokens import token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.http import HttpResponse
from .models import User
from django.contrib.auth.decorators import user_passes_test
from django.views.generic import FormView


def teacher_login(request):
    if request.user.is_authenticated:
        return redirect("home")
    if request.method == "POST":
        username = request.POST.get("username").lower()
        password = request.POST.get("password")
        try:
            user = User.objects.get(username=username)
        except:
            messages.error(request, "Teacher not found")
            return redirect("login")
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("home")
        else:
            messages.error(request, "Incorrect password")

    return render(
        request,
        "studentBase/login.html",
    )


def send_email_verification(request, user):
    current_site = get_current_site(request)
    message = render_to_string(
        "studentBase/account_activation.html",
        {
            "domain": current_site,
            "token": token_generator.make_token(user),
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "user": user,
        },
    )
    subject = "Email verification for EduView account"
    send_mail(
        subject=subject,
        recipient_list=[user.email],
        message=message,
        from_email=os.environ.get("FROM_EMAIL"),
    )


# class base register view


class UserRegisterView(FormView):
    template_name = "studentBase/register.html"
    form_class = RegisterForm

    def form_valid(self, form):
        user = form.save(commit=False)
        user.email, user.username = user.email.lower(), user.username.lower()
        user.is_active = False
        if form.cleaned_data["User_role"] == "Teacher":
            user.is_teacher = True
        elif form.cleaned_data["User_role"] == "Student":
            user.is_student = True
            student_id = int(self.request.POST.get("student_id"))
            if Profile.objects.filter(Student_ID=student_id).exists():
                user.student_id = student_id
        user.save()
        try:
            send_email_verification(self.request, user)
            messages.success(
                self.request, "An verification email has been sent to your email"
            )
            return redirect("register")
        except:
            messages.error(
                self.request,
                "Something wrong with the email verification system. Please contact admin",
            )
            return redirect("register")
        return super().form_valid(form)

    def form_invalid(self, form):
        username = self.request.POST.get("username").lower()

        if (
                User.objects.filter(username=username).exists()
                and User.objects.get(username=username).is_email_verified == False
        ):
            user = User.objects.get(username=username)
            send_email_verification(self.request, user)
            messages.success(self.request, "Activation email sent to your email")
            return super().form_invalid(form)

        if User.objects.filter(username=username).exists():
            messages.error(
                self.request, "Username taken. Please try a different username."
            )
        else:
            messages.error(self.request, "An unknown error has occurred!")
        return super().form_invalid(form)

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect("home")
        return super().get(self, request, *args, **kwargs)


def activate(request, uid, token):

    try:
        pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=pk)
    except:
        user = None

    if user is not None and user.is_teacher:

        if user.is_email_verified:
            message = "Email is already verified. Please wait for admin to approve your account."
            return render(request, "studentBase/messages.html", {"message": message})

        elif token_generator.check_token(user, token):
            user.is_email_verified = True
            user.save()
            message = "Your email has been successfully verified. Please wait for admin to approve your teacher account"
            current_site = get_current_site(request)
            encoded_pk = urlsafe_base64_encode(force_bytes(user.pk))
            approval_message = str(
                f"Approval request from {user.first_name} {user.last_name}: http://{current_site}/approval/{encoded_pk}"
            )
            try:
                send_mail(
                    subject=f"Approval request from {user.first_name} {user.last_name}",
                    message=approval_message,
                    from_email=os.environ.get("FROM_EMAIL"),
                    recipient_list=[os.environ.get("ADMIN_EMAIL")],
                )
            except:
                message = (
                    "Unable to send approval request to the admin. Please contact admin"
                )
        else:
            message = "The link is either invalid or expired. Please register again"

    elif user is not None and user.is_student:
        user.is_active = True
        user.is_email_verified = True
        user.save()
        messages.success(request, "Email successfully verified. Please login")
        return redirect("login")

    else:
        message = "User does not exist"

    context = {"message": message}
    return render(request, "studentBase/messages.html", context)


def teacher_approval(request, pk_encoded):
    try:
        pk = force_str(urlsafe_base64_decode(pk_encoded))
        user = User.objects.get(pk=pk)
    except:
        user = None
        messages.error(request, "User doesn't exist")
        return render(request, "studentBase/messages.html")
    if user != None and user.is_active == True:
        message = "This person's account is already approved"
        return render(request, "studentBase/messages.html", {"message": message})
    if request.method == "POST":
        admin_email = os.environ.get("FROM_EMAIL")
        if "approve" in request.POST:
            user.is_active = True
            user.save()
            send_mail(
                subject="EduView account approved",
                message=f"Admin approved your EduView account! Please login via http://{get_current_site(request)}/login",
                from_email=admin_email,
                recipient_list=[user.email],
            )
            return redirect("home")
        else:
            send_mail(
                subject="Admin did not approved your EduView account!",
                message=f"Sorry to inform you that the admin declined your account. "
                f"Please contact admin at {admin_email} for more information.",
                from_email=admin_email,
                recipient_list=[user.email],
            )
            user.delete()
            return redirect("home")

    context = {"pending_user": user}
    return render(request, "studentBase/approval.html", context)


@login_required(login_url="login")
def teacher_logout(request):
    logout(request)
    return redirect("login")


def teacher(user):
    return user.is_teacher


@login_required(login_url="login")
# @user_passes_test(teacher,login_url='#') set a redirect url to student dashboard
def home(request):

    student_search = request.GET.get("Student_ID")
    if student_search is None:
        student_search = ""
    else:
        student_search = student_search.lower()

    students = Profile.objects.filter(
        Q(First_Name__icontains=student_search)
        | Q(Student_ID__icontains=student_search)
        | Q(Last_Name__icontains=student_search)
        | Q(Middle_Name__icontains=student_search)
    )
    viewed_profiles_list = request.session.get("viewed_profiles", [])
    viewed_profiles = Profile.objects.filter(Student_ID__in=viewed_profiles_list)
    viewed_profiles = sorted(
        viewed_profiles,
        key=lambda profile: viewed_profiles_list.index(profile.Student_ID),
    )

    context = {"students": students, "viewed_profiles": viewed_profiles}
    return render(request, "studentBase/home.html", context)


@login_required(login_url="login")
def profile(request, id):
    student = Profile.objects.get(Student_ID=id)
    fields = student._meta.fields
    fields = [field.name for field in fields]
    student_data = {}
    exceptions = ["Photo", "Schedule", "id", "Social_Media", "Address"]
    for field in fields:
        if field not in exceptions:
            student_data[field] = getattr(student, field)

    viewed_profiles_list = request.session.get("viewed_profiles", [])

    if id not in viewed_profiles_list:
        viewed_profiles_list.insert(0, id)
        if len(viewed_profiles_list) >= 15:
            viewed_profiles_list.pop()
    else:
        viewed_profiles_list.remove(id)
        viewed_profiles_list.insert(0, id)
    request.session["viewed_profiles"] = viewed_profiles_list

    context = {"student_data": student_data, "student": student}
    return render(request, "studentBase/student.html", context)


@login_required(login_url="login")
def update_profile(request, id):
    try:
        _, worksheet = get_all_students(SHEET_NAME)
    except:
        messages.error(request, "Please wait 10 to 30 seconds before trying again.")
        return redirect("profile", id)
    student = Profile.objects.get(Student_ID=id)

    if request.method == "POST":
        form = UpdateForm(request.POST, instance=student)

        if form.is_valid():
            id_list = get_all_ids(SHEET_NAME)
            row = id_list.index(id) + 2
            form = dict(request.POST)
            gsheet_range = row_range(row)
            new_data = data_org(form)
            worksheet.update(gsheet_range, [new_data])

            return redirect(
                "home",
            )

    student = Profile.objects.get(Student_ID=id)
    form = UpdateForm(instance=student)
    context = {"form": form, "student": student}
    return render(request, "studentBase/student_profile_update.html", context)


@login_required(login_url="login")
@user_passes_test(teacher, login_url="#")
def delete_student(request, id):
    _, worksheet = get_all_students(SHEET_NAME)
    student = Profile.objects.get(Student_ID=id)
    if request.method == "POST":
        student_records = worksheet.get_all_records()
        for s in range(len(student_records)):
            Student_ID = student_records[s]["Student_ID"]
            if Student_ID == id:
                row = s + 2
                worksheet.delete_rows(row, row)
                return redirect("home")

    context = {"student": student}
    return render(request, "studentBase/delete_student.html", context)


def setting(request):
    user = request.user
    form = UpdateUserForm(instance=user)
    if request.method == "POST":
        form = UpdateUserForm(
            request.POST or None, request.FILES or None, instance=user
        )
        if form.is_valid():
            form.save()
    context = {"form": form}
    return render(request, "studentBase/user_setting.html", context)


def teacher_delete(request):
    user = request.user
    if request.method == "POST":
        user.delete()
        return redirect("login")
    return render(request, "studentBase/delete_student.html", {"student": user})
