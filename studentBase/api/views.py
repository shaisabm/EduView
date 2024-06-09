from rest_framework.decorators import api_view
from rest_framework.response import Response
from pdf2image import convert_from_path
import os
from django.http import HttpResponse

@api_view(['GET'])
def getRoutes(request):
    routes = [
        'GET /api',
        'GET /api/pdf_to_png'
    ]
    return Response(routes)

@api_view(['POST'])
def getPdfToPng(request):
    try:
        pdf_file = request.FILES['pdf_file']
        temp_path = 'static/temp/'
        with open(os.path.join(temp_path,str(pdf_file)),'wb+') as temp:
            for chunk in pdf_file.chunks():
                temp.write(chunk)

        images= convert_from_path(os.path.join(temp_path,str(pdf_file)),poppler_path='/opt/homebrew/Cellar/poppler/24.04.0/bin')
        pdf_file = str(pdf_file)
        image_name = pdf_file[:len(list(pdf_file))-4]
        for i in range(len(images)):
            images[i].save(os.path.join(temp_path,str(image_name)+'.jpg'),'JPEG')

        image_path = os.path.join(temp_path,image_name+'.jpg')
        with open(image_path,'rb') as img:
            return HttpResponse(img.read(),content_type='image/jpeg')
    except Exception as e:
        print(e)
        pass

