document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('id_prod_porcenta_dcto');
    if (input) {
        input.addEventListener('keydown', function (e) {
            // Bloquear e, E, +, - y .
            if (["e", "E", "+", "-", "."].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
});