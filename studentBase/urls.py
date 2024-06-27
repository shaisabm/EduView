from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("student/<int:id>/", views.profile, name="profile"),
    path("update-profile/<int:id>", views.update_profile, name="update-profile"),
    path("delete-student/<int:id>", views.delete_student, name="delete_student"),
    path("login/", views.user_login, name="login"),
    path("logout/", views.teacher_logout, name="logout"),
    path("register/", views.UserRegisterView.as_view(), name="register"),
    path("activate/<str:uid>/<str:token>", views.activate, name="activate"),
    path("setting/", views.setting, name="setting"),
    path("delete/", views.delete_user, name="delete_teacher"),
    path("approval/<str:pk_encoded>", views.teacher_approval, name="teacher_approval"),
    path('messages/',views.message_field, name='message_field'),
    path('message/<int:pk>', views.single_message,name='single_message')
]
