
    document.addEventListener('DOMContentLoaded', function () {
        const btnCargar = document.getElementById('btn-cargar');
        const spinner = document.getElementById('spinner');
        const mensajeError = document.getElementById('mensaje-error');
        spinner.style.display = 'none';

        // Función para mostrar el mensaje de error automáticamente para Oficina
        function mostrarMensajeErroroficina() {
            mensajeError.textContent = 'Por favor, seleccione una oficina.';
            mensajeError.style.display = 'block';

            // Ocultar el mensaje después de 5 segundos (5000 milisegundos)
            setTimeout(function () {
                mensajeError.style.display = 'none';
            }, 5000); // Cambia este valor según el tiempo que desees que el mensaje se muestre
        }

        // Función para mostrar el mensaje de error automáticamente para Archivo
        function mostrarMensajeErrorarchivo() {
            mensajeError.textContent = 'Por favor, seleccione un archivo.';
            mensajeError.style.display = 'block';

            // Ocultar el mensaje después de 5 segundos (5000 milisegundos)
            setTimeout(function () {
                mensajeError.style.display = 'none';
            }, 5000); // Cambia este valor según el tiempo que desees que el mensaje se muestre
        }

        btnCargar.addEventListener('click', function () {
            // Verificar si el campo de selección de oficina es igual a "Seleccione oficina"
            const oficinaSelect = document.getElementById('oficina');
            if (oficinaSelect.value === 'Seleccione oficina') {
                // Mostrar el mensaje de error si el campo de selección de oficina es igual a "Seleccione oficina"
                mostrarMensajeErroroficina();
                return; // Detener la ejecución del código si hay un error
            }

            // Verificar si al menos un archivo .txt está seleccionado
            const archCargasInput = document.getElementById('archCargas');
            let tieneArchivoTxt = false;
            for (let i = 0; i < archCargasInput.files.length; i++) {
                const archivo = archCargasInput.files[i];
                if (archivo.name.endsWith('.txt')) {
                    tieneArchivoTxt = true;
                    break; // Salir del bucle si se encuentra al menos un archivo .txt
                }
            }

            if (!tieneArchivoTxt) {
                // Mostrar el mensaje de error si no se encontró ningún archivo .txt
                mostrarMensajeErrorarchivo();
                return; // Detener la ejecución del código si hay un error
            }

            // Si se superaron todas las validaciones, mostrar el spinner y ocultar el mensaje de error
            mensajeError.style.display = 'none';
            spinner.style.display = 'block';
            
            // Aquí podrías agregar cualquier otra lógica que necesites
        });
    });

