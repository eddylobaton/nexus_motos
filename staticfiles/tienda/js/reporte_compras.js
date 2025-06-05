document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-filtros");
    const spinner = document.getElementById("spinner");
    const tbody = document.querySelector("#tabla-compras tbody");
    const btnBuscar = document.getElementById("btn-buscar");

    let dataTable = null; // Guardar instancia de DataTable

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const params = new URLSearchParams(formData).toString();

        const fechaInicio = formData.get("fecha_inicio");
        const fechaFin = formData.get("fecha_fin");

        if (fechaInicio && !fechaFin) {
            alert("Debe seleccionar una fecha fin.");
            return;
        }

        // Mostrar spinner y desactivar botón
        spinner.classList.remove("d-none");
        btnBuscar.disabled = true;
        tbody.innerHTML = "";

        try {
            const response = await fetch(`/filtrar-compras/?${params}`);
            if (!response.ok) throw await response.json();

            const data = await response.json();

            // Validación cuando no hay resultados
            if (data.compras.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron compras.</td></tr>';

                // Destruir DataTable si ya existe
                if (dataTable) {
                    dataTable.clear().destroy();
                    dataTable = null;
                }

                return;
            }

            // Si hay datos, construir filas
            data.compras.forEach(compra => {
                const fila = `
                    <tr>
                        <td>${compra.fecha}</td>
                        <td>${compra.usuario}</td>
                        <td>${compra.proveedor}</td>
                        <td>${compra.tipo_doc}</td>
                        <td>${compra.numero_doc}</td>
                        <td>${compra.costo_total.toFixed(2)}</td>
                        <td>${compra.igv.toFixed(2)}</td>
                    </tr>`;
                tbody.insertAdjacentHTML("beforeend", fila);
            });

            // Destruir tabla previa si existe antes de crear una nueva
            if (dataTable) {
                dataTable.destroy();
            }

            // Inicializar DataTable
            dataTable = $('#tabla-compras').DataTable({
                dom: 'Bfrtip',
                buttons: ['excel', 'csv', 'pdf'],
                responsive: true,
                destroy: true
            });
            
        } catch (err) {
            alert(err.error || "Error al buscar compras.");
        } finally {
            // Ocultar spinner y reactivar botón
            spinner.classList.add("d-none");
            btnBuscar.disabled = false;
        }
    });

});
