from django.contrib import admin
from .models import Profile, User, Message

admin.site.register(Profile)
admin.site.register(User)
admin.site.register(Message)