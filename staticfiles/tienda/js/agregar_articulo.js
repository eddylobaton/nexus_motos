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

  document.getElementById('formArticulo').addEventListener('submit', function (event) {
    event.preventDefault();  // Detener envío por defecto

    const marcaInput = document.getElementById('id_prod_marca');
    const modeloInput = document.getElementById('id_prod_modelo');
    const feedback = document.getElementById('articuloFeedback'); // div donde mostrarás errores

    const marca = marcaInput.value.trim();
    const modelo = modeloInput.value.trim();

    // Validación básica
    if (!marca || !modelo) {
        feedback.textContent = 'Debe ingresar marca y modelo.';
        feedback.classList.add('text-danger');
        return;
    }

    // Llamada a tu endpoint para verificar existencia
    fetch(`/verificar-articulo-existe/?marca=${encodeURIComponent(marca)}&modelo=${encodeURIComponent(modelo)}`)
        .then(response => response.json())
        .then(data => {
            if (data.existe) {
                feedback.textContent = 'Ya existe un artículo con esa marca y modelo.';
                feedback.classList.add('text-danger');
            } else {
                feedback.textContent = '';
                // Si no existe, enviar el formulario
                document.getElementById('formArticulo').submit();
            }
        })
        .catch(error => {
            console.error('Error al verificar artículo:', error);
            feedback.textContent = 'Error al verificar el artículo.';
            feedback.classList.add('text-danger');
        });
});