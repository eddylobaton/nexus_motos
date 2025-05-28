function inicializarRegistroProveedor() {
    const nombreInput = document.getElementById('id_proveedor_nombre');
    const rucInput = document.getElementById('id_proveedor_ruc');
    const emailInput = document.getElementById('id_proveedor_email');
    const btnSubmit = document.getElementById('btnSubmit');

    const errorNombre = document.getElementById('error_nombre');
    const errorRuc = document.getElementById('error_ruc');
    const errorEmail = document.getElementById('error_email');

    const overlay = document.getElementById('loadingOverlay');

    function limpiarErrores() {
        [nombreInput, rucInput, emailInput].forEach(input => input.classList.remove('is-invalid'));
        [errorNombre, errorRuc, errorEmail].forEach(div => div.textContent = '');
    }

    function mostrarOverlay() {
        overlay.style.display = 'flex';
    }

    function ocultarOverlay() {
        overlay.style.display = 'none';
    }

    function verificarProveedor() {
        const nombreValor = nombreInput.value.trim();
        const rucValor = rucInput.value.trim();
        const emailValor = emailInput.value.trim();

        if (!nombreValor && !rucValor && !emailValor) return;

        mostrarOverlay(); // ⏳ Mostrar mientras consulta

        fetch(`/verificar-proveedor/?nombre=${encodeURIComponent(nombreValor)}&ruc=${encodeURIComponent(rucValor)}&email=${encodeURIComponent(emailValor)}`)
            .then(response => response.json())
            .then(data => {
                limpiarErrores();
                let tieneError = false;

                if (data.existeNombre) {
                    nombreInput.classList.add('is-invalid');
                    errorNombre.textContent = `El proveedor "${nombreValor}" ya existe.`;
                    nombreInput.value = '';
                    tieneError = true;
                }

                if (data.existeRuc) {
                    rucInput.classList.add('is-invalid');
                    errorRuc.textContent = `El RUC "${rucValor}" ya está registrado.`;
                    rucInput.value = '';
                    tieneError = true;
                }

                if (data.existeEmail) {
                    emailInput.classList.add('is-invalid');
                    errorEmail.textContent = `El email "${emailValor}" ya está registrado.`;
                    emailInput.value = '';
                    tieneError = true;
                }

                btnSubmit.disabled = tieneError;
            })
            .catch(error => {
                console.error("Error al verificar proveedor:", error);
                limpiarErrores();
                nombreInput.classList.add('is-invalid');
                errorNombre.textContent = 'Error al verificar los datos del proveedor.';
                btnSubmit.disabled = true;
            })
            .finally(() => {
                ocultarOverlay(); // ✅ Ocultar overlay pase lo que pase
            });
    }

    nombreInput.addEventListener('blur', verificarProveedor);
    rucInput.addEventListener('blur', verificarProveedor);
    emailInput.addEventListener('blur', verificarProveedor);


    //**** Validar telefono
    const proveedorInput = document.querySelector('#id_proveedor_telefono');
    const feedbackDivproveedor = document.createElement('div');

    proveedorInput.parentNode.appendChild(feedbackDivproveedor);

    // Solo permitir números y máximo 9 dígitos mientras se escribe
    proveedorInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 9);
    });

    proveedorInput.addEventListener('blur', function () {
        const telefono = proveedorInput.value.trim();

         // Si está vacío, limpiar feedback y salir sin mostrar error
        if (telefono === "") {
            feedbackDivproveedor.textContent = "";
            feedbackDivproveedor.classList.remove('text-danger', 'small');
            proveedorInput.classList.remove('is-invalid');
            return;
        }

        const telfRegex = /^\d{9}$/;

        if (!telfRegex.test(telefono)) {
            feedbackDivproveedor.textContent = "Ingrese un teléfono correcto (9 dígitos).";
            feedbackDivproveedor.classList.add('text-danger', 'small');
            proveedorInput.classList.add('is-invalid');
            btnSubmit.disabled = true;
            return;
        }else{
            btnSubmit.disabled = false;
        }

        document.getElementById('loadingOverlay').style.display = 'flex';

        fetch(`/verificar-proveedor/?telefono=${telefono}`)
            .then(response => response.json())
            .then(data => {
                if (data.existeTelefono) {
                    feedbackDivproveedor.textContent = `El Teléfono "${telefono}" ya ha sido registrado.`;
                    proveedorInput.classList.add('is-invalid');
                    feedbackDivproveedor.classList.add('text-danger');
                    proveedorInput.value = '';
                } else {
                    feedbackDivproveedor.textContent = "";
                    proveedorInput.classList.remove('is-invalid');
                    feedbackDivproveedor.classList.remove('text-danger');
                }
            })
            .catch(error => {
                console.error("Error al verificar teléfono:", error);
                feedbackDivproveedor.textContent = `Ocurrió un error al verificar el teléfono "${telefono}".`;
                proveedorInput.classList.add('is-invalid');
                feedbackDivproveedor.classList.add('text-danger');
                proveedorInput.value = '';
            })
            .finally(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            });
    });

}

// Hacer la función accesible globalmente
window.inicializarRegistroProveedor = inicializarRegistroProveedor;
