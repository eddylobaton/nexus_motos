document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-filtros");
    const spinner = document.getElementById("spinner");
    const tbody = document.querySelector("#tabla-compras tbody");
    const btnBuscar = document.getElementById("btn-buscar");

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

            if (data.compras.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No se encontraron compras.</td></tr>';
            } else {
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
            }
        } catch (err) {
            alert(err.error || "Error al buscar compras.");
        } finally {
            // Ocultar spinner y reactivar botón
            spinner.classList.add("d-none");
            btnBuscar.disabled = false;
        }
    });

    // Inicializar DataTable solo una vez (si usas fetch, mejor no reinicializarlo)
    $('#tabla-compras').DataTable({
        dom: 'Bfrtip',
        buttons: ['excelHtml5', 'csvHtml5', 'pdfHtml5'],
        responsive: true,
        destroy: true, // Permite destruir si recargas
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        }
    });
});
