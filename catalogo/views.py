from django.shortcuts import render
from tienda.models import TblProducto

def catalogo_productos(request):
    productos = TblProducto.objects.filter(prod_estado=True).order_by('prod_nombre')
    return render(request, 'catalogo/catalogo.html', {'productos': productos})