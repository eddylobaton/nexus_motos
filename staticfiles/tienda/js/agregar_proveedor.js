function inicializarRegistroProveedor() {
    const nombreInput = document.getElementById('id_proveedor_nombre');
    const rucInput = document.getElementById('id_proveedor_ruc');
    const emailInput = document.getElementById('id_proveedor_email');
    const telefonoInput = document.getElementById('id_proveedor_email');


    const errorNombre = document.getElementById('error_nombre');
    const errorRuc = document.getElementById('error_ruc');
    const errorEmail = document.getElementById('error_email');
    const errorTelefono = document.getElementById('error_email');

    const overlay = document.getElementById('loadingOverlay');

    function limpiarErrores() {
        [nombreInput, rucInput, emailInput, telefonoInput].forEach(input => input.classList.remove('is-invalid'));
        [errorNombre, errorRuc, errorEmail, errorTelefono].forEach(div => div.textContent = '');
    }

    function mostrarOverlay() {
        overlay.style.display = 'flex';
    }

    function ocultarOverlay() {
        overlay.style.display = 'none';
    }

    //**** Validar nombre
    const nombreInput_ = document.querySelector('#id_proveedor_nombre');
    const feedbackDivNombre = document.createElement('div');
    
    nombreInput_.parentNode.appendChild(feedbackDivNombre);

    nombreInput.addEventListener('keydown', function (e) {
        if (['!', '#', '$', '%', '(', ')', '=', '+', '%', '?', '¿', '¡'].includes(e.key)) {
            e.preventDefault();
        }
    });

    nombreInput_.addEventListener('blur', function () {
        const nombre = nombreInput_.value.trim();

        if (nombre === "") {
            feedbackDivNombre.textContent = "";
            feedbackDivNombre.classList.remove('text-danger', 'small');
            nombreInput_.classList.remove('is-invalid');
            return;
        }

        document.getElementById('loadingOverlay').style.display = 'flex';

        fetch(`/verificar-proveedor/?nombre=${nombre}`)
            .then(response => response.json())
            .then(data => {
                if (data.existeNombre) {
                    nombreInput_.value = "";
                    feedbackDivNombre.textContent = `El nombre "${nombre}" ya ha sido registrado.`;
                    nombreInput_.classList.add('is-invalid');
                    feedbackDivNombre.classList.add('text-danger');
                } else {
                    feedbackDivNombre.textContent = "";
                    nombreInput_.classList.remove('is-invalid');
                    feedbackDivNombre.classList.remove('text-danger');
                }
            })
            .catch(error => {
                nombreInput_.value = "";
                console.error("Error al verificar el nombre:", error);
                feedbackDivNombre.textContent = "Ocurrió un error al verificar el nombre.";
                nombreInput_.classList.add('is-invalid');
            })
            .finally(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            });
    });

    //**** Validar RUC
    const rucInput_ = document.querySelector('#id_proveedor_ruc');
    const feedbackDivRuc = document.createElement('div');

    rucInput_.parentNode.appendChild(feedbackDivRuc);

    // Solo permitir números y máximo 9 dígitos mientras se escribe
    rucInput_.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0,11);
    });

    rucInput_.addEventListener('blur', function () {
        const ruc = rucInput_.value.trim();

         // Si está vacío, limpiar feedback y salir sin mostrar error
        if (ruc === "") {
            feedbackDivRuc.textContent = "";
            feedbackDivRuc.classList.remove('text-danger', 'small');
            rucInput_.classList.remove('is-invalid');
            return;
        }

        const rucfRegex = /^\d{11}$/;

        if (!rucfRegex.test(ruc)) {
            rucInput_.value = "";
            feedbackDivRuc.textContent = "Ingrese un ruc correcto (11 dígitos).";
            feedbackDivRuc.classList.add('text-danger', 'small');
            rucInput_.classList.add('is-invalid');
            return;
        }

        document.getElementById('loadingOverlay').style.display = 'flex';

        fetch(`/verificar-proveedor/?ruc=${ruc}`)
            .then(response => response.json())
            .then(data => {
                if (data.existeRuc) {
                    rucInput_.value = "";
                    feedbackDivRuc.textContent = `El ruc "${ruc}" ya ha sido registrado.`;
                    rucInput_.classList.add('is-invalid');
                    feedbackDivRuc.classList.add('text-danger');
                } else {
                    feedbackDivRuc.textContent = "";
                    rucInput_.classList.remove('is-invalid');
                    feedbackDivRuc.classList.remove('text-danger');
                }
            })
            .catch(error => {
                console.error("Error al verificar ruc:", error);
                feedbackDivRuc.textContent = "Ocurrió un error al verificar el ruc.";
                rucInput_.classList.add('is-invalid');
            })
            .finally(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            });
    });

    //**** Validar email
    const emailInput_ = document.querySelector('#id_proveedor_email');
    const feedbackDivEmail = document.createElement('div');
    
    emailInput_.parentNode.appendChild(feedbackDivEmail);

    emailInput_.addEventListener('blur', function () {
        const email = emailInput_.value.trim();

        if (email === "") {
            feedbackDivEmail.textContent = "";
            feedbackDivEmail.classList.remove('text-danger', 'small');
            emailInput_.classList.remove('is-invalid');
            return;
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailInput_.value = "";
            feedbackDivEmail.textContent = "Ingrese un email correcto.";
            feedbackDivEmail.classList.add('text-danger', 'small');
            emailInput_.classList.add('is-invalid');
            return;
        }

        document.getElementById('loadingOverlay').style.display = 'flex';

        fetch(`/verificar-proveedor/?email=${email}`)
            .then(response => response.json())
            .then(data => {
                if (data.existeEmail) {
                    emailInput_.value = "";
                    feedbackDivEmail.textContent = `El email "${email}" ya ha sido registrado.`;
                    emailInput_.classList.add('is-invalid');
                    feedbackDivEmail.classList.add('text-danger');
                } else {
                    feedbackDivEmail.textContent = "";
                    emailInput_.classList.remove('is-invalid');
                    feedbackDivEmail.classList.remove('text-danger');
                }
            })
            .catch(error => {
                emailInput_.value = "";
                console.error("Error al verificar email:", error);
                feedbackDivEmail.textContent = "Ocurrió un error al verificar el email.";
                emailInput_.classList.add('is-invalid');
            })
            .finally(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            });
    });

    //**** Validar telefono
    const telfInput = document.querySelector('#id_proveedor_telefono');
    const feedbackDivTelf = document.createElement('div');

    telfInput.parentNode.appendChild(feedbackDivTelf);

    // Solo permitir números y máximo 9 dígitos mientras se escribe
    telfInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0,9);
    });

    telfInput.addEventListener('blur', function () {
        const telefono = telfInput.value.trim();

         // Si está vacío, limpiar feedback y salir sin mostrar error
        if (telefono === "") {
            feedbackDivTelf.textContent = "";
            feedbackDivTelf.classList.remove('text-danger', 'small');
            telfInput.classList.remove('is-invalid');
            return;
        }

        const telfRegex = /^\d{9}$/;

        if (!telfRegex.test(telefono)) {
            telfInput.value = "";
            feedbackDivTelf.textContent = "Ingrese un teléfono correcto (9 dígitos).";
            feedbackDivTelf.classList.add('text-danger', 'small');
            telfInput.classList.add('is-invalid');
            return;
        }

        document.getElementById('loadingOverlay').style.display = 'flex';

        fetch(`/verificar-proveedor/?telefono=${telefono}`)
            .then(response => response.json())
            .then(data => {
                if (data.existeTelefono) {
                    telfInput.value = "";
                    feedbackDivTelf.textContent = `El teléfono "${telefono}" ya ha sido registrado.`;
                    telfInput.classList.add('is-invalid');
                    feedbackDivTelf.classList.add('text-danger');
                } else {
                    feedbackDivTelf.textContent = "";
                    telfInput.classList.remove('is-invalid');
                    feedbackDivTelf.classList.remove('text-danger');
                }
            })
            .catch(error => {
                console.error("Error al verificar teléfono:", error);
                feedbackDivTelf.textContent = "Ocurrió un error al verificar el teléfono.";
                telfInput.classList.add('is-invalid');
            })
            .finally(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            });
    });
};