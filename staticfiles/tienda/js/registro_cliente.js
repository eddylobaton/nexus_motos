document.addEventListener('DOMContentLoaded', function () {
    //**** validar DNI
    const dniInput = document.querySelector('#id_cliente_nrodocumento');
    const tipoDocInput = document.querySelector('#id_cliente_tipodocumento');
    const feedbackDivDni = document.createElement('div');
    feedbackDivDni.classList.add('text-danger', 'small');
    dniInput.parentNode.appendChild(feedbackDivDni);

    const limpiarCampos = () => {
        //document.querySelector('#id_usuario_nrodocumento').value = '';
        document.querySelector('#id_cliente_nombre').value = '';
        document.querySelector('#id_cliente_paterno').value = '';
        document.querySelector('#id_cliente_materno').value = '';
        document.querySelector('#id_cliente_direccion').value = '';
    };

    const restringirDni = function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 8);
    };

    tipoDocInput.addEventListener('change', function () {
        const tipoDoc = tipoDocInput.value;
        limpiarCampos();
        if (tipoDoc === "DNI") {
            dniInput.value = "";
            dniInput.setAttribute("maxlength", "8");
            dniInput.addEventListener("input", restringirDni);
            feedbackDivDni.textContent = "El DNI debe contener 8 dígitos numéricos.";
            feedbackDivDni.classList.remove('text-danger');
            feedbackDivDni.classList.add('text-primary');
        } else if (tipoDoc === "CE") {
            dniInput.setAttribute("maxlength", "12");
            dniInput.removeEventListener("input", restringirDni);
            feedbackDivDni.textContent = "El carnet de extranjería debe contener 12 dígitos numéricos.";
            feedbackDivDni.classList.remove('text-danger');
            feedbackDivDni.classList.add('text-primary');
        } else {
            dniInput.removeAttribute("maxlength");
            dniInput.removeEventListener("input", restringirDni);
        }
    });

    dniInput.addEventListener('blur', function () {
        const dni = dniInput.value.trim();
        const tipoDoc = tipoDocInput.value.trim();
        const dniRegex = /^\d{8}$/; // 8 dígitos numéricos
    
        // Verifica si el tipo es DNI y el valor cumple con el formato
        if (tipoDoc === "DNI" && dniRegex.test(dni)) {
            // Mostrar el overlay antes de la consulta
            document.getElementById('loadingOverlay').style.display = 'flex';
            
            fetch(`/registrar/verificar-datos-bd/?numDoc=${dni}`)
                .then(response => response.json())
                .then(data => {
                    if (data.existsDoc) {
                        limpiarCampos();
                        feedbackDivDni.textContent = "Este DNI ya está registrado en el sistema.";
                        dniInput.classList.add('is-invalid');
                        feedbackDivDni.classList.add('text-danger');
                        document.getElementById('loadingOverlay').style.display = 'none';
                    } else {

                        // Paso 2: Consultar al API externo
                        fetch(`/registrar/api/consultar-dni/?dni=${dni}`)
                            .then(response => response.json())
                            .then(data => {

                                if (data.success) {
                                    feedbackDivDni.textContent = "";
                                    dniInput.classList.remove('is-invalid');
                                    document.querySelector('#id_cliente_nombre').value = data.nombres || '';
                                    document.querySelector('#id_cliente_paterno').value = data.apellido_paterno || '';
                                    document.querySelector('#id_cliente_materno').value = data.apellido_materno || '';
                                    document.querySelector('#id_cliente_direccion').value = data.direccion || '';
                                } else {
                                    limpiarCampos();
                                    feedbackDivDni.textContent = data.error || "DNI no encontrado.";
                                    dniInput.classList.add('is-invalid');
                                }
                            })
                            .catch(error => {
                                console.error("Error en la consulta:", error);
                                limpiarCampos();
                                feedbackDivDni.textContent = "Ocurrió un error al consultar el DNI.";
                                dniInput.classList.add('is-invalid');
                                })
                            .finally(() => {
                                document.getElementById('loadingOverlay').style.display = 'none';
                            });
                    }
                })
                .catch(error => {
                    console.error("Error al validar el DNI en BD:", error);
                    feedbackDivDni.textContent = "Error al verificar si el DNI ya existe.";
                    dniInput.classList.add('is-invalid');
                    document.getElementById('loadingOverlay').style.display = 'none';
                });

        } else if (tipoDoc === "DNI" && !dniRegex.test(dni)) {
            if (dni.length > 0 && dni.length < 8) {
                limpiarCampos();
                feedbackDivDni.textContent = "El DNI debe tener exactamente 8 dígitos. Ingresó menos.";
                feedbackDivDni.classList.remove('text-danger');
                dniInput.classList.add('is-invalid');
                feedbackDivDni.classList.add('text-danger', 'small');
            } else {
                limpiarCampos();
                feedbackDivDni.textContent = "El DNI debe contener exactamente 8 dígitos numéricos.";
            }
        } 
    });

    //**** al realizar cambio en el tipo de documento limpiar imput
    tipoDocInput.addEventListener('change', function () {
        limpiarCampos();
        if (tipoDocInput.value === 'DNI') {
            dniInput.dispatchEvent(new Event('blur')); // Disparar el evento blur
        }
    });

    //**** validar fecha de nacimiento dentro del rango 
    const fechaInput = document.querySelector('#id_cliente_fechanac');
    const feedbackDivFch = document.createElement('div');
    feedbackDivFch.classList.add('text-danger', 'small');
    fechaInput.parentNode.appendChild(feedbackDivFch);
    const hoy = new Date();
    const minFecha = new Date(hoy.getFullYear() - 70, hoy.getMonth(), hoy.getDate());
    const maxFecha = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());

    // Establece los atributos min y max en el input
    fechaInput.setAttribute('min', minFecha.toISOString().split('T')[0]);
    fechaInput.setAttribute('max', maxFecha.toISOString().split('T')[0]);

    // Validación adicional al cambiar de fecha
    fechaInput.addEventListener('blur', function () {
        const valor = new Date(this.value);

        if (valor < minFecha || valor > maxFecha) {
            feedbackDivFch.textContent = "La fecha debe indicar una edad entre 18 y 70 años.";
            fechaInput.classList.add('is-invalid');
            this.value = '';
        }else{
            feedbackDivFch.textContent = "";
            fechaInput.classList.remove('is-invalid');
        }
    });

    //**** Validar email
    const emailInput = document.querySelector('#id_cliente_email');
    const feedbackDivEmail = document.createElement('div');
    
    emailInput.parentNode.appendChild(feedbackDivEmail);

    emailInput.addEventListener('blur', function () {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            feedbackDivEmail.textContent = "Ingrese un email correcto.";
            feedbackDivEmail.classList.add('text-danger', 'small');
            emailInput.classList.add('is-invalid');
            return;
        }
        document.getElementById('loadingOverlay').style.display = 'flex';


        fetch(`/registrar/verificar-datos-bd/?email=${email}`)
            .then(response => response.json())
            .then(data => {
                if (data.existsEmail) {
                    feedbackDivEmail.textContent = "Email ya ha sido registrado.";
                    emailInput.classList.add('is-invalid');
                    feedbackDivEmail.classList.add('text-danger');
                } else {
                    feedbackDivEmail.textContent = "";
                    emailInput.classList.remove('is-invalid');
                    feedbackDivEmail.classList.remove('text-danger');
                }
            })
            .catch(error => {
                console.error("Error al verificar email:", error);
                feedbackDivEmail.textContent = "Ocurrió un error al verificar el email.";
                emailInput.classList.add('is-invalid');
            })
            .finally(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
            });
    });

    //**** Validar usuario antes de registrar
    document.getElementById('formRegistro').addEventListener('submit', function (event) {
        event.preventDefault();  // Detiene el envío por defecto
    
        const numDocInput = document.getElementById('id_usuario_nrodocumento');
        const numDoc = numDocInput.value.trim();

        const emailInput = document.getElementById('id_usuario_email');
        const email = emailInput.value.trim();

        const feedback = document.getElementById('regFeedback'); //div que muestra el error, invocado desde el registro.html
        feedback.classList.add('text-danger', 'small'); //añade las clases al div invocado previamente
    
        let continuar = true; //para validar si existe numero documento o email
        let msjError = "";

        // Validar si ya existe en el sistema usando fetch
        fetch(`/registrar/verificar-datos-bd/?numDoc=${numDoc}&email=${email}`)
            .then(response => response.json())
            .then(data => {
                if (data.existsDoc) {
                    numDocInput.classList.add('is-invalid');
                    msjError = 'Este número de documento ya ha sido registrado.';
                    continuar = false;
                }

                if (data.existsEmail) {
                    emailInput.classList.add('is-invalid');
                    msjError+= (continuar ? "" : " / " ) + 'Este email ya ha sido registrado.';
                    continuar = false;
                }

                if (continuar) {
                    numDocInput.classList.remove('is-invalid');
                    feedback.textContent = '';
                    // Enviar el formulario manualmente si todo está OK
                    document.getElementById('formRegistro').submit();
                }else{
                    feedback.textContent = msjError;
                }
            })
            .catch(error => {
                console.error('Error al verificar datos:', error);
                numDocInput.classList.add('is-invalid');
                emailInput.classList.add('is-invalid');
                feedback.textContent = 'Ocurrió un error al verificar los datos.';
            });
    });
    
});