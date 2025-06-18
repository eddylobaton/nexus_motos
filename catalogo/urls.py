from django.urls import path
from . import views

urlpatterns = [
    path('', views.catalogo_productos, name='catalogo_productos'),
]