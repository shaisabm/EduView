from .models import Profile, TeacherProfile
from django.forms import ModelForm
from django import forms
from django.core.exceptions import ValidationError

class UpdateForm(ModelForm):
    class Meta:
        model = Profile
        fields ='__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["Schedule"].widget.attrs["readonly"] = True
        self.fields['Photo'].widget.attrs['readonly'] = True

class RegisterForm(ModelForm):
    user_choices = [('Student','Student'),('Teacher','Teacher')]
    User_role = forms.ChoiceField(choices=user_choices, required=True)

    email = forms.EmailField(required=True,)
    first_name = forms.CharField(required = True)
    last_name = forms.CharField(required=True)

    class Meta:
        model = User
        fields = ['username','first_name','last_name','User_role','email','password',]
        widgets = {
            'password': forms.PasswordInput(attrs={'placeholder':'**********','autocomplete':'off','data-toggle':'password'})
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if TeacherProfile.objects.filter(email=email).exists():
            raise ValidationError('An account with this email address already exists!')
        return email




