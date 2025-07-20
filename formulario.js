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
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `Error al ${editando ? 'actualizar' : 'crear'} la observación`);
        }

        const data = await response.json();
        if (!data) {
            throw new Error('No se recibió respuesta del servidor');
        }
        return data;
    } catch (error) {
        console.error('Error al guardar observación:', error);
        throw new Error(error.message || 'Error en la comunicación con el servidor');
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
    let map = null;
    let marker = null;
    
    function initMap() {
        if (map) {
            map.remove();
        }
        
        // Asegurarse de que el contenedor del mapa tenga un alto definido
        $('#map').css('height', '400px');
        
        map = L.map('map').setView([-33.45, -70.66], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Forzar un reajuste del mapa después de mostrarlo
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return map;
    }

    // Manejar el evento de clic en el botón del mapa
    $('#btnMapa').click(function() {
        const mapDiv = $('#map');
        if (mapDiv.css('display') === 'none') {
            mapDiv.show();
            $(this).text('Cerrar mapa');
            
            // Inicializar el mapa después de mostrar el div
            const currentMap = initMap();
            
            // Configurar el evento de clic en el mapa
            currentMap.on('click', function(e) {
                if (marker) {
                    currentMap.removeLayer(marker);
                }
                marker = L.marker(e.latlng).addTo(currentMap);
                $('#coordenadas').text(`Coordenadas: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
                
                // Geocoding inverso con Nominatim
                fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
                    .then(resp => resp.json())
                    .then(data => {
                        if (data.display_name) {
                            $('#ubicacion').val(data.display_name);
                        }
                    })
                    .catch(error => {
                        console.error('Error en geocoding:', error);
                        $('#ubicacion').val(`${e.latlng.lat}, ${e.latlng.lng}`);
                    });
            });
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
    const contenedor = $('<div>').addClass('aves-grid');
    aves.sort((a, b) => a.name.spanish.localeCompare(b.name.spanish));
    
    // Crear el campo oculto para mantener los valores seleccionados
    const select = $('#ave');
    select.hide();
    select.empty();
    
    // Crear la cuadrícula de aves
    aves.forEach(ave => {
        const aveCard = $(`
            <div class="ave-card" data-uid="${ave.uid}" data-ave='${JSON.stringify(ave)}'>
                <img src="${ave.images.thumb || ave.images.main}" alt="${ave.name.spanish}">
                <div class="ave-card-info">
                    <strong>${ave.name.spanish}</strong>
                    <em>${ave.name.latin}</em>
                </div>
            </div>
        `);
        
        // Agregar evento de clic
        aveCard.click(function() {
            $(this).toggleClass('selected');
            actualizarSeleccionAves();
        });
        
        contenedor.append(aveCard);
        select.append(`<option value="${ave.uid}">${ave.name.spanish}</option>`);
    });
    });
    
    // Reemplazar el select original con la cuadrícula
    select.after(contenedor);
    
    // Función para actualizar la selección en el select oculto
    function actualizarSeleccionAves() {
        const seleccionadas = $('.ave-card.selected').map(function() {
            return $(this).data('uid');
        }).get();
        
        select.val(seleccionadas);
        select.trigger('change');
    }
    
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
        const avesInfo = obs.aves && Array.isArray(obs.aves)
            ? obs.aves.map(a => a.nombreEspanol).join(', ')
            : obs.aveNombre || 'Sin ave especificada';
            
        html += `<li>
            <b>${obs.nombreObservador}</b> (${obs.email})<br>
            <small>Fecha: ${obs.fechaObservacion}<br>
            Ubicación: ${obs.ubicacion}<br>
            Aves: ${avesInfo}</small>
        </li>`;
    });
    html += '</ul>';
    div.html(html);
}
}

// Mostrar información del ave seleccionada
function mostrarInformacionAve() {
    const avesSeleccionadas = $('.ave-card.selected');
    if (avesSeleccionadas.length === 0) {
        $('#infoAve').hide();
        return;
    }

    // Limpiar contenedor de información
    $('#infoAve').empty();
    
    // Mostrar resumen de selección
    const numSeleccionadas = seleccionados.length;
    $('#infoAve').append(`
        <div class="aves-seleccionadas">
            <strong>${numSeleccionadas} ${numSeleccionadas === 1 ? 'ave seleccionada' : 'aves seleccionadas'}</strong>
        </div>
    `);
    
    // Mostrar información detallada del último ave seleccionada
    const ave = JSON.parse(seleccionados.last().attr('data-ave'));
    $('#infoAve').append(`
        <div class="ave-details">
            <img src="${ave.images.main}" alt="${ave.name.spanish}" class="ave-imagen">
            <div class="ave-info">
                <p><strong>Nombre español:</strong> ${ave.name.spanish}</p>
                <p><strong>Nombre inglés:</strong> ${ave.name.english}</p>
                <p><strong>Nombre científico:</strong> <em>${ave.name.latin}</em></p>
            </div>
        </div>
    `);
    
    // Si hay múltiples aves, mostrar lista de todas las seleccionadas
    if (numSeleccionadas > 1) {
        const listaAves = $('<div class="aves-lista"><h4>Todas las aves seleccionadas:</h4><ul></ul></div>');
        seleccionados.each(function() {
            const ave = JSON.parse($(this).attr('data-ave'));
            listaAves.find('ul').append(`<li>${ave.name.spanish} <em>(${ave.name.latin})</em></li>`);
        });
        $('#infoAve').append(listaAves);
    }
    
    $('#infoAve').show();
}

// Manejar el envío del formulario
async function manejarEnvioFormulario(e) {
    e.preventDefault();
    if (!validarFormulario()) {
        return;
    }
    try {
        const avesSeleccionadas = $('#ave').find(':selected').toArray().map(opt => {
            const ave = JSON.parse($(opt).attr('data-ave'));
            return {
                id: ave.uid,
                nombreEspanol: ave.name.spanish,
                nombreIngles: ave.name.english,
                nombreCientifico: ave.name.latin,
                imagenUrl: ave.images.main
            };
        });

        const observacion = {
            id: editando ? idEdicion : undefined,
            nombreObservador: $('#nombreObservador').val().trim(),
            email: $('#email').val().trim(),
            fechaObservacion: $('#fechaObservacion').val(),
            ubicacion: $('#ubicacion').val().trim(),
            aves: avesSeleccionadas,
            comentarios: $('#comentarios').val().trim(),
            fechaRegistro: new Date().toISOString()
        };
        await guardarObservacionEnMongoDB(observacion);
        limpiarFormulario();
        await cargarObservacionesDesdeMongoDB();
        mostrarMensajeExito(editando ? 'Observación actualizada correctamente' : 'Observación agregada correctamente');
        editando = false;
        idEdicion = null;
    } catch (error) {
        console.error('Error al procesar la observación:', error);
        mostrarMensajeError('Error al guardar la observación: ' + (error.message || 'Error desconocido'));
    }
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
    
    // Validar ave(s)
    if ($('#ave').val() === null || $('#ave').val().length === 0) {
        $('#errorAve').text('Por favor seleccione al menos un ave');
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
    if (observacion.aves && Array.isArray(observacion.aves)) {
        const ids = observacion.aves.map(a => a.id);
        $('#ave').val(ids).trigger('change');
    } else if (observacion.aveId) {
        $('#ave').val([observacion.aveId]).trigger('change');
    }
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
        const avesHtml = (obs.aves && Array.isArray(obs.aves))
            ? obs.aves.map(a => `<div><b>${a.nombreEspanol}</b> <span style='font-size:12px;color:#888;'>(${a.nombreCientifico})</span></div>`).join('')
            : obs.aveNombre || '';
        
        tbody.append(`
            <tr>
                <td>${obs.nombreObservador}</td>
                <td>${obs.email}</td>
                <td>${fecha}</td>
                <td>${obs.ubicacion}</td>
                <td>${avesHtml}</td>
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
    $('#ave').val([]).trigger('change'); // Limpiar selección múltiple
    $('#infoAve').hide().empty();
    $('.mensaje-error').text('');
    $('#coordenadas').text('');
    
    if (editando) {
        editando = false;
        idEdicion = null;
        $('#btnGuardar').text('Guardar Observación');
    }
}

// Mostrar mensaje de éxito
function mostrarMensajeExito(mensaje) {
    const div = $('<div>')
        .addClass('mensaje-exito')
        .text(mensaje)
        .css({
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            background: '#4CAF50',
            color: 'white',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 1000
        });
    
    $('body').append(div);
    
    setTimeout(() => {
        div.fadeOut('slow', function() {
            $(this).remove();
        });
    }, 3000);
}

// Mostrar mensaje de error
function mostrarMensajeError(mensaje) {
    const div = $('<div>')
        .addClass('mensaje-error')
        .text(mensaje)
        .css({
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            background: '#f44336',
            color: 'white',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 1000
        });
    
    $('body').append(div);
    
    setTimeout(() => {
        div.fadeOut('slow', function() {
            $(this).remove();
        });
    }, 5000);
}