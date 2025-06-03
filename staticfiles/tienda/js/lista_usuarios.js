$(document).ready(function () {
    $('#usuarios-table').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        order: [[2, 'asc'], [3, 'asc'], ],
    });
});