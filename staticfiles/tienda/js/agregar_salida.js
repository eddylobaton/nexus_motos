  $(document).ready(function() {
    //forma 1
    var tablaPrd = $('#tablaProductosDT').DataTable({
      paging: false,
      scrollY: '50vh',
      scrollCollapse: true,
      fixedHeader: true,
      autoWidth: false,
      language: {
        info: "Mostrando _TOTAL_ articulos",
        infoEmpty: "No hay articulos disponibles",
        zeroRecords: "No se encontraron articulos",
        emptyTable: "No hay articulos en la tabla",
      },
      order: [[1, 'asc'], ]
    });

    // Al abrir el modal, reajusta columnas
    $('#modalProductos').on('shown.bs.modal', function () {
      setTimeout(function () {
        tablaPrd.columns.adjust().draw();
      }, 100);
    });

  });

  let articulosSeleccionados = {};

  function agregarArticulo(id, nombre, modelo, marca, categoria, stock, precioVigente) {
    if (articulosSeleccionados[id]) return;

    const stockFinal = parseInt(stock);
    let precioVigFinal = parseFloat(precioVigente);
    precioVigFinal = precioVigFinal.toFixed(2);

    articulosSeleccionados[id] = { cantidad: 1, precio: 0, subtotal: 0, stock: stockFinal, precioVig: precioVigFinal };
    const fila = `
      <tr id="fila_${id}">
        <td>${nombre}</td>
        <td>${modelo}</td>
        <td>${marca}</td>
        <td>${categoria}</td>
        <td><input type="number" class="form-control cantidad" value="1" min="1" max="${stockFinal}" step="1" id="cant_${id}" required></td>
        <td><input type="number" class="form-control precio" value="0" min="0" max="${precioVigFinal}" step="0.01" id="precio_${id}" required></td>
        <td><span id="sub_${id}">0.00</span></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="eliminarArticulo(${id})"><i class="bx bx-x"></i></button></td>
      </tr>`;
    document.querySelector("#tablaArticulos tbody").insertAdjacentHTML("beforeend", fila);
    document.querySelector(`#prod_${id} button`).disabled = true;
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

  $(document).on('input', '.precio', function () {
    const $input = $(this);
    const valor = $input.val();

    // Permitir solo hasta 2 decimales
    if (!/^\d*(\.\d{0,2})?$/.test(valor)) {
        $input.val(valor.slice(0, -1));  // eliminar el último carácter ingresado
        return;
    }

    const precio = parseFloat(valor);
    const max = parseFloat($input.attr('max'));
    const id = $input.attr('id').split('_')[1];

    if (isNaN(precio) || precio < 0 || precio >= max) {
        $input.addClass('is-invalid');
    } else {
        $input.removeClass('is-invalid');
    }

    actualizarSubtotal(id);
  });

  $(document).on('keydown', '.precio', function (e) {
    if (["e", "E", "+", "-"].includes(e.key)) {
        e.preventDefault();
    }
  });

  function actualizarSubtotal(id) {
    let cant = parseFloat(document.getElementById(`cant_${id}`).value) || 0;
    let precio = parseFloat(document.getElementById(`precio_${id}`).value) || 0;
    let subtotal = cant * precio;
    document.getElementById(`sub_${id}`).innerText = subtotal.toFixed(2);
    Object.assign(articulosSeleccionados[id], {
        cantidad: cant,
        precio: precio,
        subtotal: subtotal
    });
    calcularTotal();
  }

  function calcularTotal() {
    let subtotal = 0;
    for (let id in articulosSeleccionados) {
      subtotal += articulosSeleccionados[id].subtotal;
    }
  
    const igvInput = document.getElementById("salida_igv");
    const igvPercent = parseFloat(igvInput.value) || 0;

    const subtotalOK = subtotal / (1 + (igvPercent / 100));
    const igvMonto = subtotalOK * (igvPercent / 100);
    const total = subtotal;
  
    document.getElementById("subtotalSalida").innerText = subtotalOK.toFixed(2);
    document.getElementById("igvValorSalida").innerText = igvPercent.toFixed(2);
    document.getElementById("igvSalida").innerText = igvMonto.toFixed(2);
    document.getElementById("totalSalida").innerText = total.toFixed(2);
  }

  function eliminarArticulo(id) {
    delete articulosSeleccionados[id];
    document.getElementById(`fila_${id}`).remove();
    document.querySelector(`#prod_${id} button`).disabled = false;
    calcularTotal();
  }

  document.getElementById("formSalida").addEventListener("submit", function(e) {
    e.preventDefault();
  
    if (Object.keys(articulosSeleccionados).length === 0) {
      alert("Debe agregar al menos un producto.");
      return;
    }
  
    for (let id in articulosSeleccionados) {
      const art = articulosSeleccionados[id];
      const inputCantidad = document.getElementById(`cant_${id}`);
      const inputPrecio = document.getElementById(`precio_${id}`);
      
      if (art.cantidad <= 0) {
        alert("La cantidad debe ser mayor a cero.");
        return;
      }

      if (art.precio < 0) {
        alert("El precio debe ser mayor o igual a cero.");
        return;
      }

      // VALIDACIÓN DE STOCK
      if (art.cantidad > art.stock) {
        alert(`La cantidad del producto con ID ${id} supera el stock disponible (${art.stock}).`);
        inputCantidad.classList.add('is-invalid'); // Marca el input en rojo
        return;
      } else {
        inputCantidad.classList.remove('is-invalid');
      }

      // VALIDACIÓN DE PRECIO
      if (parseFloat(art.precio) < 0 || (parseFloat(art.precio) >= parseFloat(art.precioVig))) {
        alert(`El precio del producto con ID ${id} es menor que cero o supera el precio vigente (${art.precioVig}).`);
        inputPrecio.classList.add('is-invalid'); // Marca el input en rojo
        return;
      } else {
        inputPrecio.classList.remove('is-invalid');
      }
    }
  
    const inputHidden = document.createElement("input");
    inputHidden.type = "hidden";
    inputHidden.name = "articulos";
    inputHidden.value = JSON.stringify(
      Object.entries(articulosSeleccionados).map(([id, datos]) => ({
        id: parseInt(id),
        cantidad: datos.cantidad,
        precio: datos.precio,
        subtotal: datos.subtotal,
      }))
    );
  
    // También pasar subtotal, monto_igv y total como inputs ocultos
    const inputSubtotal = document.createElement("input");
    inputSubtotal.type = "hidden";
    inputSubtotal.name = "subtotal_salida";
    inputSubtotal.value = parseFloat(document.getElementById("subtotalSalida").innerText);

    const inputMontoIgv = document.createElement("input");
    inputMontoIgv.type = "hidden";
    inputMontoIgv.name = "montoIgv_salida";
    inputMontoIgv.value = parseFloat(document.getElementById("igvSalida").innerText);
  
    const inputTotal = document.createElement("input");
    inputTotal.type = "hidden";
    inputTotal.name = "total_salida";
    inputTotal.value = parseFloat(document.getElementById("totalSalida").innerText);
  
    this.appendChild(inputHidden);
    this.appendChild(inputSubtotal);
    this.appendChild(inputMontoIgv);
    this.appendChild(inputTotal);
  
    this.submit();
  });