# from django.forms import ModelForm
from django import forms
from .models import TblUsuario, TblProducto, TblProveedor,TblCliente, TblEntrada
from django.contrib.auth.hashers import make_password
from datetime import date, timedelta
from decimal import Decimal, ROUND_DOWN

class LoginForm(forms.Form):
    usuario  = forms.CharField(max_length=45, required=True)
    password = forms.CharField(widget=forms.PasswordInput, required=True)

# Opciones para tipo de documento

SEXO = [
    ('', 'Seleccionar...'),
    ('FEMENINO', 'Femenino'),
    ('MASCULINO', 'Masculino'),
]

TIPO_DOCUMENTO_OPCIONES = [
    ('', 'Seleccionar...'),
    ('DNI', 'DNI'),
    ('CE', 'Carnet de extranjería'),
]

class RegistroUsuarioForm(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control'}),
        required=False,  # No obligatorio para no forzar cambio al editar
        label='Contraseña'
    )
    class Meta:
        model = TblUsuario
        fields = [
            'usuario_tipodocumento',
            'usuario_nrodocumento',
            'usuario_nombre',
            'usuario_paterno',
            'usuario_materno',
            'usuario_direccion',           
            'usuario_fechanac',
            'usuario_sexo',
            'usuario_email',
            'cargo',
            'tipo_usuario',
            'username',
            'password'
        ]

        labels = {
            'usuario_tipodocumento': 'Tipo de documento',
            'usuario_nrodocumento': 'Número de documento',
            'usuario_nombre': 'Nombre',
            'usuario_paterno': 'Apellido paterno',
            'usuario_materno': 'Apellido materno',
            'usuario_direccion': 'Dirección',
            'usuario_fechanac': 'Fecha de nacimiento',
            'usuario_sexo': 'Sexo',
            'usuario_email': 'Correo electrónico',
            'cargo': 'Cargo',
            'tipo_usuario': 'Tipo de usuario',
            'username': 'Nombre de usuario',
            'password': 'Contraseña'
        }

        widgets = {
            'usuario_tipodocumento': forms.Select(choices=TIPO_DOCUMENTO_OPCIONES, attrs={'class': 'form-control'}),
            'usuario_nrodocumento': forms.TextInput(attrs={'class': 'form-control'}),
            'usuario_nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'usuario_paterno': forms.TextInput(attrs={'class': 'form-control'}),
            'usuario_materno': forms.TextInput(attrs={'class': 'form-control'}),
            'usuario_direccion': forms.TextInput(attrs={'class': 'form-control'}),
            'usuario_fechanac': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'usuario_sexo': forms.Select(choices=SEXO, attrs={'class': 'form-control'}),
            'usuario_email': forms.TextInput(attrs={'class': 'form-control'}),
            'cargo': forms.Select(attrs={'class': 'form-control'}),
            'tipo_usuario': forms.Select(attrs={'class': 'form-control'}),
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'password': forms.PasswordInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Cambiar la etiqueta por defecto
        self.fields['tipo_usuario'].empty_label = "Seleccionar..."
        self.fields['cargo'].empty_label = "Seleccionar..."

        # Rango de año para fecha de nacimiento
        hoy = date.today()
        edad_min = hoy.replace(year=hoy.year - 70)
        edad_max = hoy.replace(year=hoy.year - 18)
        self.fields['usuario_fechanac'].widget.attrs['min'] = edad_min.isoformat()
        self.fields['usuario_fechanac'].widget.attrs['max'] = edad_max.isoformat()

    def save(self, commit=True):
        user = super().save(commit=False)
        user.password = make_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user
    

class ArticuloForm(forms.ModelForm):
    imagen_archivo = forms.FileField(
        required=False,  # El requerido lo manejamos manualmente en clean()
        widget=forms.ClearableFileInput(attrs={
            'class': 'form-control',
            'accept': 'image/*'
        })
    )

    # Sobrescribimos el campo aquí para capturar el valor como entero (porcentaje)
    prod_porcenta_dcto = forms.IntegerField(
        required=False,
        min_value=0,
        max_value=99,
        initial=0,  # Valor por defecto
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'placeholder': 'Descuento (%)',
            'min': '0',
            'max': '99'
        }),
        label="Descuento (%)"
    )

    class Meta:
        model = TblProducto
        fields = ['prod_nombre', 'prod_marca', 'prod_modelo', 'prod_motor', 'prod_categoria', 'prod_descripcion', 'prod_porcenta_dcto']
        labels = {
            'prod_nombre': 'Nombre',
            'prod_marca': 'Marca',
            'prod_modelo': 'Modelo',
            'prod_motor': 'Motor',
            'prod_categoria': 'Categoría',
            'prod_descripcion': 'Descripción',
        }
        widgets = {
            'prod_nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'prod_marca': forms.TextInput(attrs={'class': 'form-control'}),
            'prod_modelo': forms.TextInput(attrs={'class': 'form-control'}),
            'prod_motor': forms.TextInput(attrs={'class': 'form-control'}),
            'prod_categoria': forms.TextInput(attrs={'class': 'form-control'}),
            'prod_descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        # Aquí se determina si el producto ya tiene imagen, para luego decidir si la imagen es obligatoria
        self.tiene_imagen = kwargs.pop('tiene_imagen', False)
        super().__init__(*args, **kwargs)

        # Mostrar porcentaje como entero si ya hay valor en el modelo
        if self.instance and self.instance.prod_porcenta_dcto is not None:
            self.initial['prod_porcenta_dcto'] = int(self.instance.prod_porcenta_dcto * 100)

    def clean_prod_porcenta_dcto(self):
        valor = self.cleaned_data.get('prod_porcenta_dcto')
        if valor is None:
            return 0  # Valor por defecto si no se ingresa nada

        if valor < 0 or valor > 99:
            raise forms.ValidationError("Ingresa un número entre 0 y 99.")

        resultado = (Decimal(valor) / Decimal(100)).quantize(Decimal('0.01'), rounding=ROUND_DOWN)
        print("resultadooooooo")
        print(resultado)
        # Convertir a decimal (por ejemplo: 10 -> 0.10)
        return resultado
    
    def clean(self):
        cleaned_data = super().clean()
        imagen = self.files.get('imagen_archivo')

        # Si no tiene imagen previa y no se sube una nueva, lanzar error
        if not self.tiene_imagen and not imagen:
            self.add_error('imagen_archivo', 'Debes subir una imagen.')

        return cleaned_data


class ProveedorForm(forms.ModelForm):
    class Meta:
        model = TblProveedor
        fields = ['proveedor_nombre', 'proveedor_ruc', 'proveedor_telefono', 'proveedor_direccion', 'proveedor_email']
        labels = {
            'proveedor_nombre': 'Nombre',
            'proveedor_ruc': 'RUC',
            'proveedor_telefono': 'Teléfono',
            'proveedor_direccion': 'Dirección',
            'proveedor_email': 'Email',
        }
        widgets = {
            'proveedor_nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'proveedor_ruc': forms.TextInput(attrs={'class': 'form-control'}),
            'proveedor_telefono': forms.TextInput(attrs={'class': 'form-control'}),
            'proveedor_direccion': forms.TextInput(attrs={'class': 'form-control'}),
            'proveedor_email': forms.TextInput(attrs={'class': 'form-control'}),
        }

class ClienteForm(forms.ModelForm):
    class Meta:
        model = TblCliente
        fields = ['cliente_tipodocumento', 'cliente_nrodocumento', 'cliente_nombre', 'cliente_paterno', 'cliente_materno', 'cliente_direccion', 'cliente_fechanac', 'cliente_telefono', 'cliente_email', 'cliente_sexo']

        labels = {
            'cliente_nrodocumento': 'Número de documento',
            'cliente_tipodocumento': 'Tipo de documento',
            'cliente_nombre': 'Nombres',
            'cliente_paterno': 'Apellido paterno',
            'cliente_materno': 'Apellido materno',
            'cliente_fechanac': 'Fecha de nacimiento',
            'cliente_telefono': 'Teléfono',
            'cliente_email': 'Email',
            'cliente_sexo': 'Sexo',
            'cliente_direccion':  'Dirección',
        }
        widgets = {
            'cliente_nrodocumento': forms.TextInput(attrs={'class': 'form-control'}),
            'cliente_tipodocumento': forms.Select(choices=TIPO_DOCUMENTO_OPCIONES, attrs={'class': 'form-control'}),
            'cliente_nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'cliente_paterno': forms.TextInput(attrs={'class': 'form-control'}),
            'cliente_materno': forms.TextInput(attrs={'class': 'form-control'}),
            'cliente_direccion': forms.TextInput(attrs={'class': 'form-control'}),
            'cliente_fechanac': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'cliente_telefono': forms.TextInput(attrs={'class': 'form-control'}),
            'cliente_email': forms.TextInput(attrs={'class': 'form-control'}),
            'cliente_sexo': forms.Select(choices=SEXO, attrs={'class': 'form-control'}),
        }

