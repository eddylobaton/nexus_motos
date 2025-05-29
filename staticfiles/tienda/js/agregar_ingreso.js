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
  
  const numDocInput = document.querySelector('#entrada_num_doc');
  const comentNumDoc = document.createElement('div');
  comentNumDoc.classList.add('text-danger', 'small');
  numDocInput.parentNode.appendChild(comentNumDoc);
  const overlay = document.getElementById('loadingOverlay');

  numDocInput.addEventListener('blur', function () {
    const numDoc = numDocInput.value.trim();
    if (!numDoc) {
      numDocInput.value = "";
      comentNumDoc.textContent = "";
      numDocInput.classList.remove('is-invalid');
      return;
    }

    overlay.style.display = 'flex';
  
    fetch(`?num_doc=${numDoc}`)
      .then(response => response.json())
      .then(data => {
        if (data.existeNumDoc) {
          comentNumDoc.textContent = `El num_doc "${numDoc}" ya ha sido registrado.`;
          numDocInput.classList.add('is-invalid');
          numDocInput.value = '';
        }else{
          comentNumDoc.textContent = "";
          numDocInput.classList.remove('is-invalid');
        }
      })
      .catch(error => {
          console.error("Error al verificar num_doc:", error);
          comentNumDoc.textContent = `Ocurrió un error al verificar el num_doc "${numDoc}".`;
          numDocInput.classList.add('is-invalid');
          numDocInput.value = '';
      })
      .finally(() => {
          overlay.style.display = 'none';
      });
  });
  
  
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
        <td><input type="number" class="form-control cantidad" min="1" value="1" step="1" id="cant_${id}" required></td>
        <td><input type="number" class="form-control precio" min="0" value="0" step="0.01" id="precio_${id}" required></td>
        <td><span id="sub_${id}">0.00</span></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="eliminarArticulo(${id})"><i class="bi bi-x-lg"></i></button></td>
      </tr>`;
    document.querySelector("#tablaArticulos tbody").insertAdjacentHTML("beforeend", fila);
    document.querySelector(`#prod_${id} button`).disabled = true;
  }

  $(document).on('input', '.cantidad', function () {
    const $input = $(this);
    const cantidad = parseInt($input.val());
    const id = $input.attr('id').split('_')[1];

    if (isNaN(cantidad) || cantidad < 1) {
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
    const id = $input.attr('id').split('_')[1];

    if (isNaN(precio) || precio <= 0) {
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

    const numDoc = numDocInput.value.trim();
    if (!numDoc) {
      alert("Debe ingresar número de documento.");
      return;
    }

    numDocInput.value = numDoc;
  
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

  /*****  AGREGAR PROVEEDOR  ******/
  const btnAgregarProveedor = document.getElementById('btnAgregarProveedor');
  const modal = document.getElementById('modalProveedor');
  const modalContent = document.getElementById('modalProveedorContent');

  btnAgregarProveedor.addEventListener('click', function () {
      const url = btnAgregarProveedor.dataset.url;
      const bootstrapModal = new bootstrap.Modal(modal, {
          backdrop: 'static',   // No se cierra al hacer clic fuera
          keyboard: false       // No se cierra con ESC
      });
      bootstrapModal.show();


      modalContent.innerHTML = '<p class="text-center p-3">Cargando formulario...</p>';

      fetch(url, {
          headers: {
              'X-Requested-With': 'XMLHttpRequest'
          }
      })
      .then(response => response.json())
      .then(data => {
          modalContent.innerHTML = data.html;
            
          // Inicializar el script de validaciones del modal cargado
          if (window.inicializarRegistroProveedor) {
              window.inicializarRegistroProveedor();
          }
      })
      .catch(() => {
          modalContent.innerHTML = '<p class="text-danger text-center p-3">Error al cargar el formulario.</p>';
      });
  });

  // Delegar el submit del formulario dentro del modal
  document.addEventListener('submit', function (e) {
      if (e.target && e.target.id === 'formRegistroProv') {
          e.preventDefault();
          const form = e.target;
          const formData = new FormData(form);
          const url = btnAgregarProveedor.dataset.url;

          fetch(url, {
              method: 'POST',
              headers: {
                  'X-Requested-With': 'XMLHttpRequest'
              },
              body: formData
          })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  Swal.fire({
                      icon: 'success',
                      title: 'Proveedor registrado',
                      text: 'El Proveedor fue registrado correctamente',
                      timer: 2000,
                      showConfirmButton: false
                  });
                  const modalInstance = bootstrap.Modal.getInstance(modal);
                  modalInstance.hide();
                    
                  // Aquí puedes actualizar el selector de proveedores si deseas
                  // Por ejemplo, agregar el nuevo proveedor al <select>
                  const selectProveedor = document.getElementById('proveedor');
                  const option = document.createElement('option');
                  option.value = data.proveedor.id;
                  option.text = data.proveedor.nombre;
                  option.selected = true;
                  selectProveedor.appendChild(option);

              } else {
                  modalContent.innerHTML = data.html;
              }
          })
          .catch(error => {
              console.error('Error al guardar el proveedor:', error);
              Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Hubo un problema al guardar el proveedor.'
              });
          });
      }
  });  
  