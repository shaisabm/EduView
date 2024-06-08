from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import HttpResponse
from pdf2image import convert_from_path
from django.core.files.base import ContentFile
from PIL import Image
import io

@api_view(['GET'])
def getRoutes(request):
    routes = [
        'GET /api',
        'GET /api/pdf_to_png'
    ]
    return Response(routes)

@api_view(['POST'])
def getPdfToPng(request):
    pdf_file = request.FILES['pdf_file']
    images = convert_from_path(pdf_file.temporary_file_path())
    if images:
        image_bytes = io.BytesIO()
        images[0].save(image_bytes, format="PNG")
        image_bytes.seek(0)
        return HttpResponse(image_bytes, content_type='image/png')
    else:
        return Response({"error": "No images found in PDF"}, status=400)