from django.shortcuts import render
from django.http import HttpResponse
from django.shortcuts import render
from .services import get_all_rows

def home(request):
    return HttpResponse("Hello")


def student(request):
  rows = get_all_rows("Test sheet")
  print(rows)

