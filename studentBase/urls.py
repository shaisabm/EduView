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
    path("settings/", views.settings, name="settings"),
    path("delete/", views.delete_user, name="delete_teacher"),
    path("approval/<str:pk_encoded>", views.teacher_approval, name="teacher_approval"),
    path('chat/',views.chat, name='chat_box'),
    path('get_recent_viewed_profiles/', views.get_recent_viewed_profiles, name='get_recent_viewed_profiles'),

]
