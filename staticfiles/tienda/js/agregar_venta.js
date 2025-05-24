document.addEventListener('DOMContentLoaded', function () {
    const articulosSeleccionados = {};
    let igvPorcentaje = 18;

    var tablaPrd = $('#tablaProductosDT').DataTable({
      paging: false,
      scrollY: '50vh',
      scrollCollapse: true,
      fixedHeader: true,
      autoWidth: false,
      language: {
        search: "Buscar:",
        info: "Mostrando _TOTAL_ articulos",
        infoEmpty: "No hay articulos disponibles",
        zeroRecords: "No se encontraron articulos",
        emptyTable: "No hay articulos en la tabla",
      }
    });

    // Al abrir el modal, reajusta columnas
    $('#modalProductos').on('shown.bs.modal', function () {
      setTimeout(function () {
        tablaPrd.columns.adjust().draw();
      }, 100);
    });
  
    const tablaArticulosBody = document.querySelector('#tablaArticulos tbody');
    const igvInput = document.getElementById('igv');
    const ventaSubtotalSpan = document.getElementById('venta_subtotal_span');
    const ventaIGVSpan = document.getElementById('venta_igv_span');
    const ventaTotalSpan = document.getElementById('venta_total_span');
    const metodoPagoSelect = document.getElementById('metodo_pago');
    const montoEfectivoInput = document.getElementById('monto_efectivo');
    const numCuotasInput = document.getElementById('num_cuotas');
    const tasaInteresInput = document.getElementById('tasa_interes');

    const financiamientoSeccion = document.getElementById('financiamiento_seccion');
    const errorSpan = document.getElementById('error_efectivo');
  
    /*igvInput.addEventListener('input', function () {
      igvPorcentaje = parseFloat(this.value) || 0;
      actualizarTotales();
    });*/
  
    metodoPagoSelect.addEventListener('change', function () {
      const metodo = this.options[this.selectedIndex].text.toLowerCase();
      const totalVenta = parseFloat(ventaTotalSpan.textContent) || 0;
      financiamientoSeccion.style.display = 'none';
      errorSpan.style.display = 'none';
      tasaInteresInput.value = '0.00';
  
      if (metodo === 'efectivo') {
        montoEfectivoInput.value = totalVenta.toFixed(2);
        montoEfectivoInput.readOnly = true;
        numCuotasInput.value = '0';
      } else if (metodo === 'credito') {
        montoEfectivoInput.value = '0.00';
        montoEfectivoInput.readOnly = true;
        numCuotasInput.value = '1';
        financiamientoSeccion.style.display = 'block';
      } else if (metodo === 'mixto') {
        montoEfectivoInput.value = '';
        montoEfectivoInput.readOnly = false;
        numCuotasInput.value = '1';
        financiamientoSeccion.style.display = 'block';
      }
  
      actualizarFinanciamiento();
    });
  
    montoEfectivoInput.addEventListener('input', function () {
        actualizarFinanciamiento();
    });
  
    document.getElementById('num_cuotas').addEventListener('input', actualizarFinanciamiento);
    document.getElementById('tasa_interes').addEventListener('input', actualizarFinanciamiento);
  
    document.getElementById("comprobante").addEventListener("change", function () {
        const selected = this.options[this.selectedIndex];
        const descripcion = selected.getAttribute("data-descripcion");
        document.getElementById("venta_tipo_comprobante").value = descripcion;
    });

    document.getElementById("formularioVenta").addEventListener("submit", function (e) {
        e.preventDefault();
        const tablaArticulos = document.querySelector("#tablaArticulos tbody");
        if (tablaArticulos.children.length === 0) {
            alert("Debe agregar al menos un artículo a la venta.");
            return;
        }

        for (let id in articulosSeleccionados) {
            const art = articulosSeleccionados[id];
            const inputCantidad = document.getElementById(`cant_${id}`);
            const cantidad = parseInt(inputCantidad.value);
            const stock = art.stock;

            if (isNaN(cantidad) || cantidad <= 0 || art.precio <= 0) {
                alert("La cantidad y el precio deben ser mayores a cero.");
                return;
            }

            // VALIDACIÓN DE STOCK
            if (cantidad > stock) {
                alert(`La cantidad del producto con ID ${id} supera el stock disponible (${stock}).`);
                inputCantidad.classList.add('is-invalid'); // Marca el input en rojo
                return;
            } else {
                inputCantidad.classList.remove('is-invalid');
            }
        }

        const totalVentaF = parseFloat(ventaTotalSpan.textContent) || 0;
        const montoEfectivoF = parseFloat(montoEfectivoInput.value) || 0;
        const metodoF = metodoPagoSelect.options[metodoPagoSelect.selectedIndex].text.toLowerCase();
        const cuotas = parseInt(numCuotasInput.value);
        const interes = parseFloat(tasaInteresInput.value);

        if (metodoF === 'credito' || metodoF === 'mixto') {
            if (isNaN(cuotas) || cuotas <= 0) {
                alert("N° Cuotas no puede estar vacío o ser 0.");
                return;
            }
            if (isNaN(interes)) {
                alert("Tasa Interés no puede estar vacío");
                return;
            }
        }

        if (metodoF === 'mixto' && (montoEfectivoF === 0 || montoEfectivoF >= totalVentaF)) {
            alert("Verifica el monto en efectivo antes de continuar.");
            return;
        }

        document.getElementById("productos_json").value = JSON.stringify(
            Object.entries(articulosSeleccionados).map(([id, datos]) => ({
              id: parseInt(id),
              cantidad: datos.cantidad,
              precio: datos.precio,
              costo: datos.costo,
              descuentoT: datos.descuentoT,
              subtotal: datos.subtotal,
            }))
        );

        this.submit();
    });


    function actualizarFinanciamiento() {
      const totalVenta = parseFloat(ventaTotalSpan.textContent) || 0;
      const montoEfectivo = parseFloat(montoEfectivoInput.value) || 0;
      const montoFinanciar = Math.max(0, totalVenta - montoEfectivo);
      const metodo = metodoPagoSelect.options[metodoPagoSelect.selectedIndex].text.toLowerCase();
      errorSpan.style.display = 'none';
  
      document.getElementById('monto_financiar_span').textContent = montoFinanciar.toFixed(2);
      document.getElementById('monto_financiar').value = montoFinanciar.toFixed(2);
  
      const cuotas = parseInt(document.getElementById('num_cuotas').value) || 0;
      const interes = parseFloat(document.getElementById('tasa_interes').value) || 0;
  
      const interesTotal = montoFinanciar * (interes / 100);
      const totalConInteres = montoFinanciar + interesTotal;
      const pagoMensual = cuotas > 0 ? totalConInteres / cuotas : 0;
  
      document.getElementById('total_interes').value = interesTotal.toFixed(2);
      document.getElementById('total_financiamiento').value = totalConInteres.toFixed(2);
      document.getElementById('pago_mensual').value = pagoMensual.toFixed(2);

      if (metodo === 'mixto' && montoEfectivo >= totalVenta) {
            errorSpan.style.display = 'inline';
      }

    }
  
    window.agregarArticulo = function (id, nombre, modelo, marca, categoria, descuento, stock, precioVigente, utilidad) {
      if (articulosSeleccionados[id]) return;
  
      const stockFinal = parseInt(stock);
      articulosSeleccionados[id] = { cantidad: 1, precio: 0, descuento: descuento, stock: stockFinal };
      
      let precioFinal = parseFloat(precioVigente) + (parseFloat(precioVigente) * (parseFloat(utilidad) / 100));
      precioFinal = precioFinal.toFixed(2);

      const fila = `
        <tr id="fila_${id}">
          <td>${nombre}</td>
          <td>${modelo}</td>
          <td>${marca}</td>
          <td>${categoria}</td>
          <td><input type="number" class="form-control cantidad" value="1" min="1" max="${stockFinal}" step="1" id="cant_${id}" required></td>
          <td><input type="number" min="0" class="form-control" value="${precioFinal}" id="precio_${id}" readonly></td>
          <td><span id="costo_${id}">0.00</span></td>
          <td><span id="desc_${id}">0.00</span></td>
          <td><span id="total_${id}">0.00</span></td>
          <td><button type="button" class="btn btn-danger btn-sm" onclick="eliminarArticulo(${id})"><i class="bi bi-x-lg"></i></button></td>
        </tr>`;
      tablaArticulosBody.insertAdjacentHTML('beforeend', fila);
      document.querySelector(`#prod_${id} button`).disabled = true;
  
      actualizarSubtotal(id);
    }

    $(document).on('input', '.cantidad', function () {
        const $input = $(this);
        const cantidad = parseInt($input.val());
        const max = parseInt($input.attr('max'));
        const id = $input.attr('id').split('_')[1];

        if (isNaN(cantidad) || cantidad < 1 || cantidad > max) {
            $input.addClass('is-invalid');
        } else {
            $input.removeClass('is-invalid');
        }

        actualizarSubtotal(id);
    });

    $(document).on('keydown', '.cantidad', function (e) {
        if (["e", "E", "+", "-", "."].includes(e.key)) {
            e.preventDefault();
        }
    });
  
    window.actualizarSubtotal = function (id) {
      const cantidad = parseFloat(document.getElementById(`cant_${id}`).value) || 0;
      const precio = parseFloat(document.getElementById(`precio_${id}`).value) || 0;
      const dcto = articulosSeleccionados[id].descuento || 0;
  
      const costo = cantidad * precio;
      const descuento = costo * (dcto / 100);
      const total = costo - descuento;
  
      document.getElementById(`costo_${id}`).textContent = costo.toFixed(2);
      document.getElementById(`desc_${id}`).textContent = descuento.toFixed(2);
      document.getElementById(`total_${id}`).textContent = total.toFixed(2);
  
      articulosSeleccionados[id].cantidad = cantidad;
      articulosSeleccionados[id].precio = precio;
      articulosSeleccionados[id].costo = costo;
      articulosSeleccionados[id].descuentoT = descuento;
      articulosSeleccionados[id].subtotal = total;
  
      actualizarTotales();
    }
  
    window.eliminarArticulo = function (id) {
      delete articulosSeleccionados[id];
      document.getElementById(`fila_${id}`).remove();
      document.querySelector(`#prod_${id} button`).disabled = false;
      actualizarTotales();
    }
  
    function actualizarTotales() {
      let subtotal = 0; //incluye IGV
      for (const id in articulosSeleccionados) {
        subtotal += articulosSeleccionados[id].subtotal;
      }

      const subtotalOK = subtotal / (1 + (igvPorcentaje / 100));
      const igv = subtotalOK * (igvPorcentaje / 100);
      const total = subtotal;
  
      ventaSubtotalSpan.textContent = subtotalOK.toFixed(2);
      ventaIGVSpan.textContent = igv.toFixed(2);
      ventaTotalSpan.textContent = total.toFixed(2);

      document.getElementById('venta_subtotal').value = subtotalOK.toFixed(2);
      document.getElementById('venta_igv').value = igv.toFixed(2);
      document.getElementById('venta_total').value = total.toFixed(2);
  
      const metodo = metodoPagoSelect.options[metodoPagoSelect.selectedIndex].text.toLowerCase();
      if (metodo === 'efectivo') {
        montoEfectivoInput.value = total.toFixed(2);
      }
  
      actualizarFinanciamiento();
    }
  });
  