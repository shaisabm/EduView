from .models import Profile
from django.forms import ModelForm
from django import forms
class UpdateForm(ModelForm):
    class Meta:
        model = Profile
        fields ='__all__'


    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["Schedule"].widget.attrs["readonly"] = True
        self.fields['Photo'].widget.attrs['readonly'] = True

