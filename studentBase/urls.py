from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name="home"),
    path('students/',views.student,name = '`student`')
]
