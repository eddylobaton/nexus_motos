$(document).ready(function () {
    $('#ventas-table').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        order: [[0, 'asc'], ],
    });
});