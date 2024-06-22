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

class TeacherProfileForm(ModelForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(required = True)
    last_name = forms.CharField(required=True)

    class Meta:
        model = TeacherProfile
        fields = ['username','first_name','last_name','email','password']
        widgets = {'email':forms.TextInput(attrs={'placeholder':'Only Edu Email Allowed'})}
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if TeacherProfile.objects.filter(email=email).exists():
            raise ValidationError('An account with this email address already exists!')
        return email




