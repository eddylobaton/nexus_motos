$(document).ready(function () {
    $('#productos-table').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        order: [[1, 'asc'], [2, 'asc'], ],
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

});