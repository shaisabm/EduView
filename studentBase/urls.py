from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.home, name="home"),
    path('student/<int:id>/',views.profile,name = 'profile'),
    path('update-profile/<int:id>',views.update_profile, name='update-profile'),
    path('delete-student/<int:id>', views.delete_student,name='delete_student'),
    path('login/',views.teacher_login,name='login'),
    path('logout/',views.teacher_logout, name='logout'),
    path('register/',views.teacher_register, name='register'),
    path('activate/<str:uid>/<str:token>',views.activate,name='activate')
]
urlpatterns += static(settings.MEDIA_URL,document_root = settings.MEDIA_ROOT)