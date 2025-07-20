// Reemplazar LocalStorage por llamadas a la API
async function cargarObservacionesDesdeMongoDB() {
    try {
        const response = await fetch('/api/observaciones');
        if (!response.ok) throw new Error('Error al cargar observaciones');
        observaciones = await response.json();
        mostrarObservaciones();
    } catch (error) {
        console.error('Error:', error);
        mostrarMensajeError('Error al cargar observaciones. Intente más tarde.');
    }
}

async function guardarObservacionEnMongoDB(observacion) {
    const method = editando ? 'PUT' : 'POST';
    const url = editando ? `/api/observaciones/${observacion.id}` : '/api/observaciones';
    
    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(observacion)
        });
        
        if (!response.ok) throw new Error('Error al guardar');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function eliminarObservacionDeMongoDB(id) {
    try {
        const response = await fetch(`/api/observaciones/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar');
        return true;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
// Variables globales
let observaciones = [];
let editando = false;
let idEdicion = null;

// Esperar a que el DOM esté listo
$(document).ready(function() {
    cargarAvesDesdeAPI();
    cargarObservacionesDesdeMongoDB();
    // Eventos
    $('#ave').change(mostrarInformacionAve);
    $('#formularioAves').submit(manejarEnvioFormulario);
    $('#btnLimpiar').click(limpiarFormulario);

    // Mapa Leaflet: inicializar solo al mostrar
    let map, marker;
    $('#btnMapa').click(function() {
        const mapDiv = $('#map');
        if (mapDiv.css('display') === 'none') {
            mapDiv.show();
            $(this).text('Cerrar mapa');
            setTimeout(function() {
                if (map) {
                    map.remove();
                    map = null;
                }
                map = L.map('map').setView([-33.45, -70.66], 6);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 18,
                    attribution: '© OpenStreetMap'
                }).addTo(map);
                map.on('click', function(e) {
                    if (marker) map.removeLayer(marker);
                    marker = L.marker(e.latlng).addTo(map);
                    $('#ubicacion').val('');
                    $('#coordenadas').text('Coordenadas: ' + e.latlng.lat.toFixed(5) + ', ' + e.latlng.lng.toFixed(5));
                    // Geocoding inverso con Nominatim
                    fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + e.latlng.lat + '&lon=' + e.latlng.lng)
                      .then(resp => resp.json())
                      .then(data => {
                        if (data.display_name) {
                          $('#ubicacion').val(data.display_name);
                        }
                      });
                });
            }, 100);
        } else {
            mapDiv.hide();
            $(this).text('Seleccionar en el mapa');
            if (map) {
                map.remove();
                map = null;
            }
        }
    });
    $('#ubicacion').on('input', function() {
        $('#coordenadas').text('');
    });
});

// Función para cargar las aves desde el JSON (API)
function cargarAvesDesdeAPI() {
    // Consumir la API externa de aves
    $.ajax({
        url: 'https://aves.ninjas.cl/api/birds',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            llenarSelectAves(data);
        },
        error: function(error) {
            console.error('Error al cargar las aves:', error);
            mostrarMensajeError('Error al cargar la lista de aves. Intente recargar la página.');
        }
    });
}

// Llenar el select con las aves
function llenarSelectAves(aves) {
    const select = $('#ave');
    select.empty();
    select.append('<option value="">-- Selecciona un ave --</option>');
    aves.sort((a, b) => a.name.spanish.localeCompare(b.name.spanish));
    aves.slice(0, 20).forEach(ave => {
        select.append(`<option value="${ave.uid}" data-ave='${JSON.stringify(ave)}'>${ave.name.spanish}</option>`);
    });
    // Buscar usuario y mostrar sus avistamientos
    $('#btnBuscarUsuario').click(async function() {
        const query = $('#buscarUsuario').val().trim().toLowerCase();
        if (!query) return;
        let lista = observaciones.filter(obs =>
            obs.nombreObservador.toLowerCase().includes(query) ||
            obs.email.toLowerCase().includes(query)
        );
        mostrarResultadosUsuario(lista, query);
    });

    // Filtrar por fecha
    $('#btnFiltrarFecha').click(function() {
        const fecha = $('#filtrarFecha').val();
        if (!fecha) return;
        let lista = observaciones.filter(obs => obs.fechaObservacion === fecha);
        mostrarResultadosUsuario(lista, 'Fecha: ' + fecha);
    });
// Mostrar resultados de usuario o filtro
function mostrarResultadosUsuario(lista, criterio) {
    const div = $('#resultadosUsuario');
    if (!lista.length) {
        div.html(`<strong>No se encontraron resultados para: ${criterio}</strong>`);
        return;
    }
    let html = `<strong>Resultados para: ${criterio}</strong><ul>`;
    lista.forEach(obs => {
        html += `<li><b>${obs.nombreObservador}</b> (${obs.email}) - ${obs.fechaObservacion} - ${obs.ubicacion} - ${obs.aveNombre}</li>`;
    });
    html += '</ul>';
    div.html(html);
}
}

// Mostrar información del ave seleccionada
function mostrarInformacionAve() {
    const seleccionado = $('#ave').find(':selected');
    if (seleccionado.val() === '') {
        $('#infoAve').hide();
        return;
    }
    const ave = JSON.parse(seleccionado.attr('data-ave'));
    $('#nombreEspanol').text(ave.name.spanish);
    $('#nombreIngles').text(ave.name.english);
    $('#nombreCientifico').text(ave.name.latin);
    $('#imagenAve').attr('src', ave.images.main);
    $('#infoAve').show();
}

// Manejar el envío del formulario
function manejarEnvioFormulario(e) {
    e.preventDefault();
    if (!validarFormulario()) {
        return;
    }
    const observacion = {
        id: editando ? idEdicion : undefined,
        nombreObservador: $('#nombreObservador').val(),
        email: $('#email').val(),
        fechaObservacion: $('#fechaObservacion').val(),
        ubicacion: $('#ubicacion').val(),
        aveId: $('#ave').val(),
        aveNombre: $('#ave').find(':selected').text(),
        comentarios: $('#comentarios').val(),
        fechaRegistro: new Date().toISOString()
    };
    guardarObservacionEnMongoDB(observacion)
        .then(() => {
            limpiarFormulario();
            cargarObservacionesDesdeMongoDB();
            mostrarMensajeExito(editando ? 'Observación actualizada correctamente' : 'Observación agregada correctamente');
            editando = false;
            idEdicion = null;
        })
        .catch(() => mostrarMensajeError('Error al guardar la observación.'));
}

// Validar el formulario
function validarFormulario() {
    let valido = true;
    
    // Validar nombre
    if ($('#nombreObservador').val().trim() === '') {
        $('#errorNombre').text('Por favor ingrese su nombre');
        valido = false;
    } else {
        $('#errorNombre').text('');
    }
    
    // Validar email
    const email = $('#email').val();
    if (!email || !validarEmail(email)) {
        $('#errorEmail').text('Por favor ingrese un email válido');
        valido = false;
    } else {
        $('#errorEmail').text('');
    }
    
    // Validar fecha
    if (!$('#fechaObservacion').val()) {
        $('#errorFecha').text('Por favor seleccione una fecha');
        valido = false;
    } else {
        $('#errorFecha').text('');
    }
    
    // Validar ubicación
    if ($('#ubicacion').val().trim() === '') {
        $('#errorUbicacion').text('Por favor ingrese una ubicación');
        valido = false;
    } else {
        $('#errorUbicacion').text('');
    }
    
    // Validar ave
    if ($('#ave').val() === '') {
        $('#errorAve').text('Por favor seleccione un ave');
        valido = false;
    } else {
        $('#errorAve').text('');
    }
    
    // Comentarios es opcional, no validar
    
    return valido;
}

// Validar formato de email
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Agregar nueva observación
function agregarObservacion(observacion) {
    // Ya no se usa LocalStorage. CRUD se hace por API.
}

// Actualizar observación existente
function actualizarObservacion(observacionActualizada) {
    // Ya no se usa LocalStorage. CRUD se hace por API.
}

// Eliminar observación
function eliminarObservacion(id) {
    if (confirm('¿Está seguro que desea eliminar esta observación?')) {
        eliminarObservacionDeMongoDB(id)
            .then(() => {
                cargarObservacionesDesdeMongoDB();
                mostrarMensajeExito('Observación eliminada correctamente');
            })
            .catch(() => mostrarMensajeError('Error al eliminar la observación.'));
    }
}

// Editar observación
function editarObservacion(id) {
    const observacion = observaciones.find(obs => obs.id === id);
    if (!observacion) return;
    
    $('#nombreObservador').val(observacion.nombreObservador);
    $('#email').val(observacion.email);
    $('#fechaObservacion').val(observacion.fechaObservacion);
    $('#ubicacion').val(observacion.ubicacion);
    $('#ave').val(observacion.aveId).trigger('change');
    $('#comentarios').val(observacion.comentarios);
    
    editando = true;
    idEdicion = id;
    $('#btnGuardar').text('Actualizar Observación');
    $('html, body').animate({ scrollTop: 0 }, 'slow');
}

// Mostrar todas las observaciones en la tabla
function mostrarObservaciones() {
    const tbody = $('#tablaObservaciones tbody');
    tbody.empty();
    
    if (observaciones.length === 0) {
        tbody.append('<tr><td colspan="6">No hay observaciones registradas</td></tr>');
        return;
    }
    
    observaciones.forEach(obs => {
        const fecha = new Date(obs.fechaObservacion).toLocaleDateString('es-CL');
        
        tbody.append(`
            <tr>
                <td>${obs.nombreObservador}</td>
                <td>${obs.email}</td>
                <td>${fecha}</td>
                <td>${obs.ubicacion}</td>
                <td>${obs.aveNombre}</td>
                <td>
                    <button class="btn-editar" data-id="${obs.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${obs.id}">Eliminar</button>
                </td>
            </tr>
        `);
    });
    
    // Asignar eventos a los botones
    $('.btn-editar').click(function() {
        editarObservacion(parseInt($(this).data('id')));
    });
    
    $('.btn-eliminar').click(function() {
        eliminarObservacion(parseInt($(this).data('id')));
    });
}

// Cargar observaciones desde LocalStorage
function cargarObservacionesDesdeLocalStorage() {
    // Eliminado: ya no se usa LocalStorage
}

// Guardar observaciones en LocalStorage
function guardarObservacionesEnLocalStorage() {
    // Eliminado: ya no se usa LocalStorage
}

// Limpiar el formulario
function limpiarFormulario() {
    $('#formularioAves')[0].reset();
    $('#infoAve').hide();
    $('.mensaje-error').text('');
    
    if (editando) {
        editando = false;
        idEdicion = null;
        $('#btnGuardar').text('Guardar Observación');
    }
}

// Mostrar mensaje de éxito
function mostrarMensajeExito(mensaje) {
    alert(mensaje); // Podrías reemplazar esto con un toast o mensaje en pantalla
}

// Mostrar mensaje de error
function mostrarMensajeError(mensaje) {
    alert('Error: ' + mensaje); // Podrías reemplazar esto con un toast o mensaje en pantalla
}