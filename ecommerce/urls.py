"""
URL configuration for ecommerce project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from tienda import views

urlpatterns = [
    # HOMRE---------
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/',views.signoup, name= 'logout'),
    # ARTICULOS-------------------
    path('productos/',views.lista_productos, name= 'lista_productos'),
    path('lista_articulos/',views.lista_articulos, name= 'lista_articulos'),
    path('agregar_articulos/',views.agregar_articulos, name= 'agregar_articulos'),
    path('articulo/<int:producto_id>/', views.detalle_articulo, name='detalle_articulo'),
    path('editar_articulo/<int:producto_id>/', views.editar_articulo, name='editar_articulo'),
    path('cambiar_estado_articulo/<int:producto_id>/', views.cambiar_estado_articulo, name='cambiar_estado_articulo'),
    # INGRESOS-------------------
    path('lista_ingresos/',views.lista_ingresos, name= 'lista_ingresos'),
    path('agregar_ingresos/',views.agregar_ingresos, name= 'agregar_ingresos'),

    # PROVEEDOR-------------------
    path('lista_proveedores/',views.lista_proveedores, name= 'lista_proveedores'),
    path('agregar_proveedor/',views.agregar_proveedor, name= 'agregar_proveedor'),
    path('proveedor/<int:prov_id>/', views.detalle_proveedor, name='detalle_proveedor'),
    path('editar_proveedor/<int:prov_id>/', views.editar_proveedor, name='editar_proveedor'),
    # CLIENTES-------------------
    path('lista_clientes/',views.lista_clientes, name= 'lista_clientes'),
    path('agregar_cliente/',views.agregar_cliente, name= 'agregar_cliente'),
    path('cliente/<int:clien_id>/', views.detalle_cliente, name='detalle_cliente'),
    path('editar_cliente/<int:clien_id>/', views.editar_cliente, name='editar_cliente'),
    # VENTAS-------------------
    path('lista_ventas/',views.lista_ventas, name= 'lista_ventas'),
    path('agregar_venta/',views.agregar_venta, name= 'agregar_venta'),
    path('venta/pdf/<int:venta_id>/', views.generar_pdf_venta, name='generar_pdf_venta'),
    path('venta/<int:venta_id>/', views.detalle_venta, name='detalle_venta'),
    # USUARIO-------------------
    path('lista_usuarios/',views.lista_usuarios, name= 'lista_usuarios'),
    path('agregar_usuario/',views.agregar_usuario, name= 'agregar_usuario'),
    path('registrar/', views.registrar_usuario, name='registrar_usuario'),
    path('usuario/<int:id>/', views.detalle_usuario, name='detalle_usuario'),
    path('editar_usuario/<int:id>/', views.editar_usuario, name='editar_usuario'),
    
    

    # VALIDACIONES
    path('registrar/api/consultar-dni/', views.consultar_dni, name='consultar_dni'),
    path('registrar/verificar-username/', views.verificar_username, name='verificar_username'),
    path('registrar/verificar-datos-bd/', views.verificar_datos, name='verificar_datos'),

    path('verificar-articulo-existe/', views.verificar_articulo_existe, name='verificar_articulo'),

]
