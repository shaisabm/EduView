from django.urls import path
from . import views

urlpatterns = [
    path('', views.getRoutes),
    path('pdf_to_png', views.getPdfToPng),
]