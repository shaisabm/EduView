from django.db import models
from django.contrib.auth.models import AbstractUser

class Profile(models.Model):
    Student_ID = models.IntegerField(unique=True)
    First_Name = models.CharField(max_length=50)
    Middle_Name = models.CharField(max_length=50,null=True,blank=True)
    Last_Name = models.CharField(max_length=50)
    Gender = models.CharField(max_length=25, null=True, blank=True)
    Grade = models.CharField(max_length=10,null=True,blank=True)
    Photo = models.CharField(null=True, blank=True,max_length=200)
    Schedule = models.CharField(null=True,blank=True, max_length=200)
    Social_Media = models.CharField(max_length=50,null=True,blank=True)
    Address = models.CharField(max_length=50,null=True,blank=True)
    Email = models.EmailField(null=True, blank=True)
    Contact_1 = models.CharField(max_length=12,null=True,blank=True)
    Contact_2 = models.CharField(max_length=12,null=True, blank=True)




    def __str__(self):
        return f"{self.First_Name} {self.Middle_Name} {self.Last_Name}".strip()

class TeacherProfile(AbstractUser):
    is_teacher = models.BooleanField(null=True)
    profile_pic = models.ImageField(null=True,blank=True)

    def __str__(self):
        return f'{self.first_name} {self.last_name} teacher:{self.is_teacher}'.strip()


