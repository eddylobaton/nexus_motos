document.addEventListener('DOMContentLoaded', function () {
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
});
