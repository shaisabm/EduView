from .models import Profile, User
from django.forms import ModelForm, ClearableFileInput
from django import forms
from django.core.exceptions import ValidationError


class UpdateForm(ModelForm):  # this use to update the students info only
    class Meta:
        model = Profile
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["Schedule"].widget.attrs["readonly"] = True
        self.fields["Photo"].widget.attrs["readonly"] = True
        student_id = self.instance.Student_ID
        user = User.objects.get(student_id=student_id)
        if user.is_student:
            self.fields["Student_ID"].widget.attrs["readonly"] = True
            self.fields["First_Name"].widget.attrs["readonly"] = True
            self.fields["Middle_Name"].widget.attrs["readonly"] = True
            self.fields["Last_Name"].widget.attrs["readonly"] = True
            self.fields["Grade"].widget.attrs["readonly"] = True


class RegisterForm(ModelForm):
    user_choices = [("Teacher", "Teacher"), ("Student", "Student")]
    User_role = forms.ChoiceField(choices=user_choices, required=True)

    email = forms.EmailField(
        required=True,
    )
    first_name = forms.CharField(required=True)
    last_name = forms.CharField(required=True)

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "User_role",
            "email",
            "password",
        ]
        widgets = {
            "password": forms.PasswordInput(
                attrs={
                    "placeholder": "**********",
                    "autocomplete": "off",
                    "data-toggle": "password",
                }
            )
        }

    def clean_email(self):
        email = self.cleaned_data.get("email").lower()
        if (
            User.objects.filter(email=email).exists()
            and User.objects.get(email=email).is_email_verified
        ):
            raise ValidationError("An account with this email address already exists!")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data.get("password"))
        if self.cleaned_data.get("User_role") == "Teacher":
            user.is_teacher = True
        elif self.cleaned_data.get("User_role") == "Student":
            user.is_student = True
        if commit:
            user.save()
        return user


class CustomClearableFileInput(ClearableFileInput):
    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context["widget"]["is_initial"] = False
        return context


class UpdateUserForm(ModelForm):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "profile_pic", "email"]
        widgets = {"profile_pic": CustomClearableFileInput}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.is_student:
            del self.fields["profile_pic"]

    def clean_email(self):
        new_email = self.cleaned_data.get("email").lower()
        old_email = self.instance.email
        if User.objects.filter(email=new_email).exists() and new_email != old_email:
            raise ValidationError("This email is associated with another account!")
        return new_email
