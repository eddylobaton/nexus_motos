  $(document).ready(function() {
    //forma 1
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


    // forma 02
    /*let tablaPrd = null;

    $('#modalProductos').on('shown.bs.modal', function () {
      if (!tablaPrd) {
        tablaPrd = $('#tablaProductosDT').DataTable({
          paging: false,
          scrollY: '50vh',
          scrollCollapse: true,
          fixedHeader: true,
          autoWidth: false,
          language: {
            search: "Buscar:",
            info: "Mostrando _TOTAL_ productos",
            infoEmpty: "No hay productos disponibles",
            zeroRecords: "No se encontraron productos",
            emptyTable: "No hay productos en la tabla",
          }
        });
      } else {
        tablaPrd.columns.adjust().draw();
      }
    }); */

  });
  
  
  function actualizarNumeroDoc() {
    const tipoDocID = document.getElementById("tipo_doc").value;
    if (!tipoDocID) {
      document.getElementById("entrada_num_doc").value = "";
      return;
    }
  
    fetch(`?tipo_doc_id=${tipoDocID}`)
      .then(response => response.json())
      .then(data => {
        document.getElementById("entrada_num_doc").value = data.numero;
      })
      .catch(error => console.error("Error al obtener número de documento:", error));
  }
  
  
  let articulosSeleccionados = {};

  function agregarArticulo(id, nombre, modelo, marca, categoria) {
    if (articulosSeleccionados[id]) return;

    articulosSeleccionados[id] = { cantidad: 1, precio: 0, subtotal: 0 };
    const fila = `
      <tr id="fila_${id}">
        <td>${nombre}</td>
        <td>${modelo}</td>
        <td>${marca}</td>
        <td>${categoria}</td>
        <td><input type="number" class="form-control" min="1" value="1" onchange="actualizarSubtotal(${id})" id="cant_${id}"></td>
        <td><input type="number" class="form-control" min="0" value="0" onchange="actualizarSubtotal(${id})" id="precio_${id}"></td>
        <td><span id="sub_${id}">0.00</span></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="eliminarArticulo(${id})"><i class="bi bi-x-lg"></i></button></td>
      </tr>`;
    document.querySelector("#tablaArticulos tbody").insertAdjacentHTML("beforeend", fila);
    document.querySelector(`#prod_${id} button`).disabled = true;
  }

  function actualizarSubtotal(id) {
    let cant = parseFloat(document.getElementById(`cant_${id}`).value) || 0;
    let precio = parseFloat(document.getElementById(`precio_${id}`).value) || 0;
    let subtotal = cant * precio;
    document.getElementById(`sub_${id}`).innerText = subtotal.toFixed(2);
    articulosSeleccionados[id] = { cantidad: cant, precio: precio, subtotal: subtotal };
    calcularTotal();
  }

  function calcularTotal() {
    let subtotal = 0;
    for (let id in articulosSeleccionados) {
      subtotal += articulosSeleccionados[id].subtotal;
    }
  
    const igvInput = document.getElementById("entrada_igv");
    const igvPercent = parseFloat(igvInput.value) || 0;

    const subtotalOK = subtotal / (1 + (igvPercent / 100));
    const igvMonto = subtotalOK * (igvPercent / 100);
    const total = subtotal;
  
    document.getElementById("subtotalEntrada").innerText = subtotalOK.toFixed(2);
    document.getElementById("igvValorEntrada").innerText = igvPercent.toFixed(2);
    document.getElementById("igvEntrada").innerText = igvMonto.toFixed(2);
    document.getElementById("totalEntrada").innerText = total.toFixed(2);
  }

  function eliminarArticulo(id) {
    delete articulosSeleccionados[id];
    document.getElementById(`fila_${id}`).remove();
    document.querySelector(`#prod_${id} button`).disabled = false;
    calcularTotal();
  }


  document.getElementById("formEntrada").addEventListener("submit", function(e) {
    e.preventDefault();
  
    if (Object.keys(articulosSeleccionados).length === 0) {
      alert("Debe agregar al menos un producto.");
      return;
    }
  
    for (let id in articulosSeleccionados) {
      const art = articulosSeleccionados[id];
      if (art.cantidad <= 0 || art.precio <= 0) {
        alert("La cantidad y el precio deben ser mayores a cero.");
        return;
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
    inputSubtotal.name = "subtotal_entrada";
    inputSubtotal.value = parseFloat(document.getElementById("subtotalEntrada").innerText);

    const inputMontoIgv = document.createElement("input");
    inputMontoIgv.type = "hidden";
    inputMontoIgv.name = "montoIgv_entrada";
    inputMontoIgv.value = parseFloat(document.getElementById("igvEntrada").innerText);
  
    const inputTotal = document.createElement("input");
    inputTotal.type = "hidden";
    inputTotal.name = "total_entrada";
    inputTotal.value = parseFloat(document.getElementById("totalEntrada").innerText);
  
    this.appendChild(inputHidden);
    this.appendChild(inputSubtotal);
    this.appendChild(inputMontoIgv);
    this.appendChild(inputTotal);
  
    this.submit();
  });
  