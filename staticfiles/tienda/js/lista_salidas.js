$(document).ready(function () {
    $('#salidas-table').DataTable({
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