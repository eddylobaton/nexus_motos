import os
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404, render, redirect

from django.conf import settings
from .forms import LoginForm, RegistroUsuarioForm, ArticuloForm, ProveedorForm, ClienteForm
from .models import TblUsuario, TblProducto, TblProveedor, TblCliente, TblVenta, TblDetVenta, TblEntrada,TblTipoDocAlmacen, TblDetEntrada, TblMetodoPago, TblSalida, TblDetSalida, TblFinanciamiento, TblDetFinanciamiento
from django.contrib import messages
from django.core.paginator import Paginator
from datetime import datetime
from django.utils import timezone
from datetime import date, timedelta
from django.db.models import Max
from django.contrib.auth.decorators import login_required
from django.db import transaction, connection, InternalError
from decimal import Decimal
from django.template.loader import render_to_string
from django.template.loader import get_template
from django.urls import reverse
from django.utils.http import urlencode
from xhtml2pdf import pisa
from num2words import num2words
import json

import requests
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST

from django.contrib.auth import get_user_model

User = get_user_model()

# Create your views here.
def home(request):
    return render(request, 'tienda/home.html')

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            # Obtener los datos del formulario
            usuarios = form.cleaned_data['usuario']
            passwords = form.cleaned_data['password']

            # Buscar el usuario de forma segura
            user_qs = TblUsuario.objects.filter(username=usuarios)  #obtiene todos los registros que coinciden con el username
            if user_qs.exists():
                if user_qs.count() > 1:
                    form.add_error('usuario', 'Hay múltiples usuarios con este nombre. Contacta al administrador.')
                else:
                    # Intentamos autenticar (validar contraseña)
                    user = authenticate(request, username=usuarios, password=passwords)
                    if user is not None:
                        login(request, user)
                        request.session['id'] = user.id     # Puedes usar user.usuario_id si lo prefieres
                        return redirect('home')
                    else:
                        form.add_error('password', 'Contraseña incorrecta') # Añadir error para la contraseña incorrecta
                        #form.add_error(None, 'Contraseña incorrecta')
            else:
                form.add_error('usuario', 'El nombre de usuario no existe')
    else:
        form = LoginForm()

    return render(request, 'tienda/login.html', {'form': form})

@require_GET
@login_required
def consultar_dni(request):
    dni = request.GET.get('dni')
    if not dni:
        return JsonResponse({'success': False, 'error': 'DNI no proporcionado.'})
    
    try:
        token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzODU0MiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.-e-nfoCiwEwPqJrbjNzNRQHhlzm21LIAolTMsTcTZEE'
        url = f"https://api.factiliza.com/v1/dni/info/{dni}"
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(url, headers=headers)
        #print(response.text)
        if response.status_code == 200:
            data = response.json()
            return JsonResponse({
                'success': True,
                'nombres': data.get('data', {}).get('nombres'), #data['data']['nombres']
                'apellido_paterno': data.get('data', {}).get('apellido_paterno'),
                'apellido_materno': data.get('data', {}).get('apellido_materno'),
                'direccion': data.get('data', {}).get('direccion'),
            })
        else:
            return JsonResponse({'success': False, 'error': 'DNI no encontrado.'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_GET
@login_required
def verificar_username(request):
    username = request.GET.get('username', '')
    existe = User.objects.filter(username=username).exists()
    return JsonResponse({'existe': existe})

@login_required
def verificar_datos(request):
    numDoc = request.GET.get('numDoc')
    email = request.GET.get('email')
    existeDoc = TblUsuario.objects.filter(usuario_nrodocumento=numDoc).exists() if numDoc else False
    existeEmail = TblUsuario.objects.filter(usuario_email=email).exists() if email else False

    return JsonResponse({'existsDoc': existeDoc, 'existsEmail': existeEmail})

@login_required
def registrar_usuario(request):
    if request.method == 'POST':
        form = RegistroUsuarioForm(request.POST)
        if form.is_valid():

            form.save()
            messages.success(request, 'Usuario registrado exitosamente.')
            return redirect('login')  # o a donde quieras redirigir después
        else:
            messages.error(request, 'Por favor corrige los errores.')
    else:
        form = RegistroUsuarioForm()
    return render(request, 'tienda/registro.html', {'form': form})

@login_required
def signoup (request):
    logout(request) 
    return redirect('home')

@login_required
def lista_productos(request):
    productos = TblProducto.objects.all()
    paginator = Paginator(productos, 6)  # Mostrar 6 productos por página
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return render(request, 'tienda/productos.html', {'page_obj': page_obj})

@login_required
def lista_articulos(request):
    productos = TblProducto.objects.all()
    
    for producto in productos:
        if producto.prod_porcenta_dcto:
            producto.descuento_porcentaje = int(producto.prod_porcenta_dcto)
        else:
            producto.descuento_porcentaje = 0

    return render(request, 'tienda/lista_articulos.html', {'productos': productos})

@login_required
def agregar_articulos(request):
    if request.method == 'POST':
        form = ArticuloForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                producto = form.save(commit=False)
                imagen = request.FILES.get('imagen_archivo')

                if imagen:
                    ruta_destino = os.path.join(settings.BASE_DIR, 'staticfiles', 'tienda', 'img')
                    os.makedirs(ruta_destino, exist_ok=True)
                    path_final = os.path.join(ruta_destino, imagen.name)

                    with open(path_final, 'wb+') as destino:
                        for chunk in imagen.chunks():
                            destino.write(chunk)

                    producto.prod_imagen = imagen.name  # solo el nombre del archivo

                producto.prod_fecha_registro = datetime.now()
                producto.save()
                return redirect('lista_articulos')
            except Exception as e:
                print(f'Error al guardar el producto: {e}')  # Esto mostrará el error exacto
        else:
            print('Formulario inválido:', form.errors)
    else:
        form = ArticuloForm()

    return render(request, 'tienda/agregar_articulos.html', {'form': form})

@login_required
def editar_articulo(request, producto_id):
    producto = get_object_or_404(TblProducto, prod_id=producto_id)

    # Verificamos si el producto tiene una imagen
    tiene_imagen = bool(producto.prod_imagen)

    if request.method == 'POST':
        form = ArticuloForm(request.POST, request.FILES, instance=producto, tiene_imagen=tiene_imagen)
        
        if form.is_valid():
            producto = form.save(commit=False)
            imagen = request.FILES.get('imagen_archivo')

            if imagen:
                ruta_destino = os.path.join(os.path.dirname(__file__), '..', 'staticfiles', 'tienda', 'img')
                os.makedirs(ruta_destino, exist_ok=True)
                path_final = os.path.join(ruta_destino, imagen.name)
                with open(path_final, 'wb+') as destino:
                    for chunk in imagen.chunks():
                        destino.write(chunk)
                producto.prod_imagen = imagen.name

            producto.save()
            print("Producto editado exitosamente")
            return redirect('lista_articulos')
        else:
            print("Formulario inválido:")
            print(form.errors)
    else:
        form = ArticuloForm(instance=producto, tiene_imagen=tiene_imagen)

    return render(request, 'tienda/editar_articulo.html', {'form': form, 'producto': producto})

@login_required
def detalle_articulo(request, producto_id):
    producto = get_object_or_404(TblProducto, pk=producto_id)
    descuento_porcentaje = int(producto.prod_porcenta_dcto)
    return render(request, 'tienda/detalle_articulo.html', {
        'producto': producto,
        'descuento_porcentaje': descuento_porcentaje
    })

@require_POST
@login_required
def cambiar_estado_articulo(request, producto_id):
    producto = get_object_or_404(TblProducto, prod_id=producto_id)
    producto.prod_estado = not producto.prod_estado
    producto.save()

    estado = "activado" if producto.prod_estado else "desactivado"
    return JsonResponse({"message": f'Artículo "{producto.prod_nombre}" ha sido {estado} correctamente.'})

@login_required
def editar_proveedor(request, prov_id):
    proveedor = get_object_or_404(TblProveedor, proveedor_id = prov_id)
    if request.method == 'POST':
        form = ProveedorForm(request.POST, instance=proveedor)

        if form.is_valid():
            proveedor.save()
            return redirect('lista_proveedores')
            
        else:
            print(form.errors)
    else:
        form = ProveedorForm(instance=proveedor)

    return render(request, 'tienda/editar_proveedor.html', {'form': form, 'proveedor': proveedor})

@login_required
def editar_cliente(request, clien_id):
    cliente = get_object_or_404(TblCliente, cliente_id = clien_id)
    if request.method == 'POST':
        form = ClienteForm(request.POST, instance=cliente)

        if form.is_valid():
            cliente.save()
            return redirect('lista_clientes')
            
        else:
            print(form.errors)
    else:
        form = ClienteForm(instance=cliente)

    return render(request, 'tienda/editar_cliente.html', {'form': form, 'cliente': cliente})

@login_required
def editar_usuario(request, id):
    usuario = get_object_or_404(TblUsuario, id = id)
    if request.method == 'POST':
        form = RegistroUsuarioForm(request.POST, instance=usuario)

        if form.is_valid():
            usuario.save()
            return redirect('lista_usuarios')
            
        else:
            print(form.errors)
    else:
        form = RegistroUsuarioForm(instance=usuario)

    return render(request, 'tienda/editar_usuario.html', {'form': form, 'usuario': usuario})

@login_required
def lista_proveedores(request):
    proveedor = TblProveedor.objects.all()
    return render(request, 'tienda/lista_proveedores.html', {'proveedor': proveedor})

@login_required
def agregar_proveedor(request):
    if request.method == 'POST':
        form = ProveedorForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                proveedor = form.save(commit=False)
                proveedor.save()
                return redirect('lista_proveedores')
            except Exception as e:
                print(f'Error al guardar el proveedor: {e}')  # Esto mostrará el error exacto
        else:
            print('Formulario inválido:', form.errors)
    else:
        form = ProveedorForm()

    return render(request, 'tienda/agregar_proveedor.html', {'form': form})

@login_required
def detalle_proveedor(request, prov_id):
    proveedor = get_object_or_404(TblProveedor, pk=prov_id)
    return render(request, 'tienda/detalle_proveedor.html', {'proveedor': proveedor})

@login_required
def detalle_cliente(request, clien_id):
    cliente = get_object_or_404(TblCliente, pk=clien_id)
    return render(request, 'tienda/detalle_cliente.html', {'cliente': cliente})

@login_required
def lista_ingresos(request):
    ingresos = TblEntrada.objects.select_related(
        'proveedor', 'tipo_doc_almacen', 'usuario'
    ).all()
    return render(request, 'tienda/lista_ingresos.html', {'ingresos': ingresos})

@transaction.atomic
@login_required
def agregar_ingresos(request):
    if request.method == "POST":
        try:
            proveedor_id = request.POST.get("proveedor_id")
            tipo_doc_id = request.POST.get("tipo_doc_almacen_id")
            entrada_num_doc = request.POST.get("entrada_num_doc")
            #entrada_fecha = request.POST.get("entrada_fecha")
            entrada_igv = float(request.POST.get("entrada_igv", 0))
            entrada_subtotal = float(request.POST.get("subtotal_entrada") or 0)
            entrada_monto_igv = float(request.POST.get("montoIgv_entrada") or 0)
            entrada_total = float(request.POST.get("total_entrada") or 0)

            articulos_json = request.POST.get("articulos")  # Este es un JSON con los productos
            articulos = json.loads(articulos_json)

            if not articulos:
                messages.error(request, "Debe agregar al menos un producto.")
                return redirect("agregar_ingresos")

            for art in articulos:
                if art["cantidad"] <= 0 or art["precio"] <= 0:
                    messages.error(request, "Cantidad y precio deben ser mayores a cero.")
                    return redirect("agregar_ingresos")

            # Guardar entrada
            entrada = TblEntrada.objects.create(
                entrada_fecha=timezone.now(),  #entrada_fecha,
                entrada_num_doc=entrada_num_doc,
                entrada_subtotal=entrada_subtotal,
                entrada_costo_igv=entrada_monto_igv,
                entrada_igv=entrada_igv,
                entrada_costo_total=entrada_total,
                proveedor_id=proveedor_id,
                tipo_doc_almacen_id=tipo_doc_id,
                usuario_id=request.user.id
            )

            # Guardar detalle por producto
            for art in articulos:
                TblDetEntrada.objects.create(
                    entrada=entrada,
                    prod_id=art["id"],
                    det_entrada_cantidad=art["cantidad"],
                    det_entrada_precio_costo=art["precio"],
                    det_entrada_sub_total=art["subtotal"]
                )

                # Llamar al procedimiento almacenado
                with connection.cursor() as cursor:
                    cursor.callproc("sp_actualizar_kardex", [
                        'ENTRADA',
                        art["id"],
                        art["cantidad"],
                        art["precio"],
                        0  # cantidad_salida
                    ])

            messages.success(request, "Entrada registrada correctamente.")
            return redirect("lista_ingresos")  # Puedes cambiar a la vista de listado

        except Exception as e:
            # Marcar rollback si ocurre error
            transaction.set_rollback(True)

            # Extraer mensaje SQL si viene de procedimiento
            mensaje_mysql = str(e)
            if hasattr(e, 'args') and len(e.args) > 1:
                mensaje_mysql = e.args[1]

            messages.error(request, f"Ocurrió un error: {mensaje_mysql}")
            return redirect("agregar_ingresos")

    proveedores = TblProveedor.objects.all()
    tipos_doc = TblTipoDocAlmacen.objects.filter(tipo_doc_almacen_tipo__in=['ES', 'E', 'EI'])
    productos = TblProducto.objects.filter(prod_estado=True)

    tipo_seleccionado_id = request.GET.get('tipo_doc_id')

    if tipo_seleccionado_id:
        tipo_doc = TblTipoDocAlmacen.objects.get(pk=tipo_seleccionado_id)
        tipo_codigo = tipo_doc.tipo_doc_almacen_tipo  # ES, E o EI

        # Lógica de agrupamiento para prefijos y filtrado
        if tipo_codigo in ['ES', 'E']:
            tipo_cod_prefijo = 'E'
            tipos_a_contar = ['ES', 'E']
        elif tipo_codigo == 'EI':
            tipo_cod_prefijo = 'EI'
            tipos_a_contar = ['EI']
        else:
            return JsonResponse({'numero': ''})  # En caso de un tipo inesperado

        # Obtener los tipos que tienen ese tipo_cod_prefijo
        entradas = TblEntrada.objects.filter(
            tipo_doc_almacen__tipo_doc_almacen_tipo__in=tipos_a_contar
        )

        # Extraer el correlativo mayor
        max_num = 0
        for entrada in entradas:
            try:
                num = int(entrada.entrada_num_doc.split("-")[1])
                max_num = max(max_num, num)
            except:
                continue

        nuevo_num = max_num + 1
        numero_generado = f"{tipo_cod_prefijo}-{nuevo_num:05d}"

        return JsonResponse({'numero': numero_generado})


    #hoy = date.today()
    #hace_dos_dias = hoy - timedelta(days=2)

    return render(request, 'tienda/agregar_ingresos.html', {
        'proveedores': proveedores,
        'tipos_doc': tipos_doc,
        'productos': productos,
        #'fecha_hoy': hoy.strftime('%Y-%m-%d'),
        #'fecha_min': hace_dos_dias.strftime('%Y-%m-%d'),
    })

@login_required
def lista_clientes(request):
    clientes = TblCliente.objects.all()
    return render(request, 'tienda/lista_clientes.html', {'clientes': clientes})

@login_required
def agregar_cliente(request):
    if request.method == 'POST':
        form = ClienteForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                cliente = form.save(commit=False)
                cliente.save()
                return redirect('lista_clientes')
            except Exception as e:
                print(f'Error al guardar el cliente: {e}')  # Esto mostrará el error exacto
        else:
            print('Formulario inválido:', form.errors)
    else:
        form = ClienteForm()

    return render(request, 'tienda/agregar_cliente.html', {'form': form})

@login_required
def lista_ventas(request):
    ventas = TblVenta.objects.select_related('cliente', 'usuario', 'metodo_pago').all()
    return render(request, 'tienda/lista_ventas.html', {'ventas': ventas})

@transaction.atomic
@login_required
def agregar_venta(request):
    if request.method == 'POST':
        try:
            cliente_id = request.POST.get('cliente')
            tipo_comprobante = request.POST.get('venta_tipo_comprobante')
            nro_documento = request.POST.get('venta_nro_documento')
            metodo_pago_id = request.POST.get('metodo_pago')
            usuario_id = request.user.id

            subtotal = float(request.POST.get('venta_subtotal'))
            igv = float(request.POST.get('igv'))
            costo_igv = float(request.POST.get('venta_igv'))
            total = float(request.POST.get('venta_total'))
            monto_efectivo = float(request.POST.get('monto_efectivo'))

            tipo_doc_obj = TblTipoDocAlmacen.objects.get(tipo_doc_almacen_descripcion=tipo_comprobante)

            # 1. Guardar TblVenta
            try:
                venta = TblVenta.objects.create(
                    venta_fecha_venta=timezone.now(),
                    venta_tipo_comprobante=tipo_comprobante,
                    venta_nro_documento=nro_documento,
                    venta_monto_efectivo=monto_efectivo,
                    venta_subtotal=subtotal,
                    venta_igv=igv,
                    venta_costo_igv=costo_igv,
                    venta_total=total,
                    metodo_pago_id=metodo_pago_id,
                    cliente_id=cliente_id,
                    usuario_id=usuario_id
                )
            except Exception as e:
                print("Error al guardar TblVenta:", e)
                raise

            # 2. Guardar TblDetVenta
            try:
                productos_json = request.POST.get('productos_json')
                total_productos = json.loads(productos_json)
                for item in total_productos:
                    TblDetVenta.objects.create(
                        venta=venta,
                        prod_id=item['id'],
                        det_venta_cantidad=item['cantidad'],
                        det_venta_precio_unitario=float(item['precio']),
                        det_venta_subtotal=float(item['costo']),
                        det_venta_dcto=float(item['descuentoT']),
                        det_venta_total=float(item['subtotal'])
                    )
            except Exception as e:
                print("Error al guardar TblDetVenta:", e)
                raise

            # 3. Guardar TblSalida
            try:
                salida = TblSalida.objects.create(
                    salida_fecha=timezone.now(),
                    salida_num_doc=nro_documento,
                    salida_subtotal=subtotal,
                    salida_igv=igv,
                    salida_costo_igv=costo_igv,
                    salida_costo_total=total,
                    salida_motivo='VENTA',
                    tipo_doc_almacen_id=tipo_doc_obj.tipo_doc_almacen_id,
                    usuario_id=usuario_id
                )
            except Exception as e:
                print("Error al guardar TblSalida:", e)
                raise

            # 4. Guardar TblDetSalida
            try:
                for item in total_productos:
                    cantidad = item['cantidad']
                    subtotal_item = float(item['subtotal'])
                    precio_salida = float(subtotal_item / cantidad if cantidad else 0)

                    TblDetSalida.objects.create(
                        salida=salida,
                        prod_id=item['id'],
                        det_salida_cantidad=cantidad,
                        det_salida_sub_total=subtotal_item,
                        det_salida_precio_salida=precio_salida
                    )
                    
                    # Llamar al procedimiento almacenado
                    with connection.cursor() as cursor:
                        cursor.callproc("sp_actualizar_kardex", [
                            'SALIDA',
                            item["id"],
                            0,
                            0,
                            cantidad  # cantidad_salida
                        ])

            except Exception as e:
                print("Error al guardar TblDetSalida:", e)
                raise

            # 5. Si hay financiamiento
            try:
                metodo_pago_nombre = TblMetodoPago.objects.get(metodo_pago_id=metodo_pago_id).metodo_pago_descrip.lower()
                if metodo_pago_nombre in ['credito', 'mixto']:
                    monto_financiar = float(request.POST.get('monto_financiar', 0))
                    num_cuotas = int(request.POST.get('num_cuotas'))
                    tasa_interes = float(request.POST.get('tasa_interes'))
                    total_interes = float(request.POST.get('total_interes'))
                    total_financiamiento = float(request.POST.get('total_financiamiento'))
                    pago_mensual = float(request.POST.get('pago_mensual'))
                    fecha_pago_opcion = int(request.POST.get('fecha_pago'))

                    financiamiento = TblFinanciamiento.objects.create(
                        financia_monto_financiado=monto_financiar,
                        financia_numero_cuotas=num_cuotas,
                        financia_tasa_interes=tasa_interes,
                        financia_total_interes=total_interes,
                        financia_monto_total=total_financiamiento,
                        financia_fecha_registro=date.today(),
                        financia_estado='PENDIENTE',
                        venta=venta
                    )

                    for i in range(num_cuotas):
                        mes = date.today().month + i + 1
                        año = date.today().year
                        if mes > 12:
                            mes -= 12
                            año += 1
                        fecha_cuota = date(año, mes, fecha_pago_opcion)

                        TblDetFinanciamiento.objects.create(
                            det_finan_num_cuota=i + 1,
                            det_finan_monto_cuota=pago_mensual,
                            det_finan_fch_pago_max=fecha_cuota,
                            det_finan_estado_pago='PENDIENTE',
                            financia=financiamiento
                        )
            except Exception as e:
                print("Error al guardar financiamiento:", e)
                raise    

            messages.success(request, "Venta registrada correctamente.")
            url = reverse('lista_ventas') # vista del listado de ventas
            query_string = urlencode({'pdf': venta.venta_id})
            full_url = f'{url}?{query_string}'
            return redirect(full_url)

        except Exception as e:
            print("ERROR AL GUARDAR VENTA:", e)
            transaction.set_rollback(True)

            # Extraer mensaje SQL si viene de procedimiento
            mensaje_mysql = str(e)
            if hasattr(e, 'args') and len(e.args) > 1:
                mensaje_mysql = e.args[1]

            messages.error(request, f"Ocurrió un error: {mensaje_mysql}")
            return redirect("agregar_venta")
            
    else:
        # Vista GET: cargar formulario
        clientes = TblCliente.objects.all()
        comprobantes = TblTipoDocAlmacen.objects.filter(tipo_doc_almacen_tipo='ES')
        metodos_pago = TblMetodoPago.objects.all()
        productos = TblProducto.objects.filter(prod_estado=True).select_related('tblkardex')
        nro_documento = f"V-{TblVenta.objects.count() + 1:05d}"
        
        context = {
            'clientes': clientes,
            'comprobantes': comprobantes,
            'metodos_pago': metodos_pago,
            'productos': productos,
            'nro_documento': nro_documento
        }
        return render(request, 'tienda/agregar_venta.html', context)

def numero_a_letras(numero):
    parte_entera = int(numero)
    parte_decimal = int(round((numero - parte_entera) * 100))

    texto = num2words(parte_entera, lang='es').upper()
    return f"{texto} Y {parte_decimal:02d}/100 NUEVOS SOLES"

@login_required
def generar_pdf_venta(request, venta_id):
    venta = get_object_or_404(TblVenta, pk=venta_id)
    detalle_venta = TblDetVenta.objects.filter(venta=venta)
    financiamiento = TblFinanciamiento.objects.filter(venta=venta).first()
    detalle_financiamiento = TblDetFinanciamiento.objects.filter(financia=financiamiento) if financiamiento else []

    descuento_total = sum(item.det_venta_dcto for item in detalle_venta)
    total_letras = numero_a_letras(venta.venta_total)
    
    # Reemplaza con tus propios contextos reales
    context = {
        'venta': venta,
        'detalle_venta': detalle_venta,
        'financiamiento': financiamiento,
        'detalle_financiamiento': detalle_financiamiento,
        'descuento_total': descuento_total,
        'total_letras': total_letras,
    }

    template_path = 'tienda/venta_pdf.html'
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="venta_{venta_id}.pdf"'
    
    template = get_template(template_path)
    html = template.render(context)

    pisa_status = pisa.CreatePDF(html, dest=response)
    if pisa_status.err:
        return HttpResponse('Error al generar el PDF', status=500)
    
    return response

@login_required
def detalle_venta(request, venta_id):
    venta = get_object_or_404(TblVenta, pk=venta_id)
    return render(request, 'tienda/detalle_venta.html', {'venta': venta})

@login_required
def lista_salidas(request):
    salidas = TblSalida.objects.select_related('tipo_doc_almacen', 'usuario').all()
    return render(request, 'tienda/lista_salidas.html', {'salidas': salidas})

@login_required
def lista_usuarios(request):
    usuarios  = TblUsuario.objects.all()
    return render(request, 'tienda/lista_usuarios.html', {'usuarios': usuarios})

@login_required
def agregar_usuario(request):
    if request.method == 'POST':
        form = RegistroUsuarioForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                usuario = form.save(commit=False)
                usuario.save()
                return redirect('lista_usuarios')
            except Exception as e:
                print(f'Error al guardar el usuario: {e}')  # Esto mostrará el error exacto
        else:
            print('Formulario inválido:', form.errors)
    else:
        form = RegistroUsuarioForm()

    return render(request, 'tienda/agregar_usuario.html', {'form': form})

@login_required
def detalle_usuario(request, id):
    usuario = get_object_or_404(TblUsuario, pk=id)
    return render(request, 'tienda/detalle_usuario.html', {'usuario': usuario})

@login_required
def verificar_articulo_existe(request):
    marca = request.GET.get('marca')
    modelo = request.GET.get('modelo')

    existe = TblProducto.objects.filter(prod_marca=marca, prod_modelo=modelo).exists()
    return JsonResponse({'existe': existe})