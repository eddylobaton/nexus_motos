document.addEventListener("DOMContentLoaded", function () {
    const fechaInicioInput = document.getElementById("fecha_inicio");
    const fechaFinInput = document.getElementById("fecha_fin");

    fechaInicioInput.addEventListener("change", function () {
        fechaFinInput.min = this.value;
        if (fechaFinInput.value < this.value) {
            fechaFinInput.value = this.value;
        }
    });

    const form = document.getElementById("form-filtros");
    const spinner = document.getElementById("spinner");
    const btnBuscar = document.getElementById("btn-buscar");

    // ⚠️ Inicializar correctamente DataTable una sola vez
    const tabla = $('#tabla-compras').DataTable({
        dom: 'Bfrtip',
        buttons: ['excel', 'csv', 'pdf'],
        responsive: true,
        data: [], // inicial vacío
        columns: [
            { title: "Fecha" },
            { title: "Usuario" },
            { title: "Proveedor" },
            { title: "Tipo Doc" },
            { title: "Número Doc" },
            { title: "Costo Total" },
            { title: "IGV" }
        ]
    });

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

        spinner.classList.remove("d-none");
        btnBuscar.disabled = true;

        try {
            const response = await fetch(`/filtrar-compras/?${params}`);
            if (!response.ok) throw await response.json();

            const data = await response.json();

            // 🔄 Limpiar y agregar nuevas filas con la API de DataTables
            tabla.clear();

            if (data.compras.length > 0) {
                const filas = data.compras.map(compra => ([
                    compra.fecha,
                    compra.usuario,
                    compra.proveedor,
                    compra.tipo_doc,
                    compra.numero_doc,
                    compra.costo_total.toFixed(2),
                    compra.igv.toFixed(2)
                ]));
                tabla.rows.add(filas);
            }

            tabla.draw(); // mostrar

        } catch (err) {
            alert(err.error || "Error al buscar compras.");
        } finally {
            spinner.classList.add("d-none");
            btnBuscar.disabled = false;
        }
    });
});
