$(document).ready(function () {
    $('#productos-table').DataTable({
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json',
            lengthMenu: "Mostrar _MENU_ registros",
            zeroRecords: "No se encontraron resultados",
            info: "Mostrando de _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            search: "Buscar:",
            paginate: {
                first: "Primero",
                last: "Último",
                next: "Siguiente",
                previous: "Anterior"
            },
        },
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        ordering: true,
        responsive: true,
        autoWidth: false,
        columnDefs: [
            { orderable: false, targets: -1 }  // Columna "Acciones" no ordenable
        ]
    });
});

document.addEventListener("DOMContentLoaded", function () {

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    document.querySelectorAll(".toggle-estado").forEach(function (toggle) {
        toggle.addEventListener("click", function (e) {
            e.preventDefault();

            const switchTrigger = e.target;
            const id = switchTrigger.getAttribute("data-producto-id");
            const nombre = switchTrigger.getAttribute("data-producto-nombre");
            const estado = switchTrigger.getAttribute("data-producto-estado") === "True";

            const mensaje = estado
                ? `¿Deseas desactivar el artículo "${nombre}"?`
                : `¿Deseas activar el artículo "${nombre}"?`;

            Swal.fire({
                title: '¿Confirmar cambio de estado?',
                text: mensaje,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, confirmar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Procesando...',
                        text: 'Por favor espera',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    fetch(`/cambiar_estado_articulo/${id}/`, {
                        method: "POST",
                        headers: {
                            "X-CSRFToken": csrfToken,
                            "Content-Type": "application/json"
                        }
                    })
                    .then(response => {
                        if (!response.ok) throw new Error("Error en la respuesta");
                        return response.json();
                    })
                    .then(data => {
                        Swal.fire({
                            title: 'Éxito',
                            text: data.message,
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            window.location.reload();
                        });
                    })
                    .catch(error => {
                        Swal.fire({
                            title: 'Error',
                            text: 'Ocurrió un problema al cambiar el estado.',
                            icon: 'error',
                            confirmButtonText: 'Cerrar'
                        });
                    });
                }
            });
        });
    });


    const switches = document.querySelectorAll(".toggle-estado");

    switches.forEach(function (input) {
        const label = input.closest(".switch");
        const textSpan = label.querySelector(".switch-text");

        const updateText = () => {
            textSpan.textContent = input.checked ? "ON" : "OFF";
        };

        // Inicializa texto
        updateText();

        // Actualiza al hacer clic, pero sin cambiar el estado aún (por el modal)
        input.addEventListener("click", function (e) {
            e.preventDefault();  // prevenimos el cambio sin confirmar
            updateText();        // actualizamos el texto inmediatamente (visual)
        });
    });

});