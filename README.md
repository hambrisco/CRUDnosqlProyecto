# formularioAves

Formulario web para el registro y gestión de observaciones de aves chilenas.

## Características
- Registro de observaciones con validación de datos.
- Selección de aves desde API pública (https://aves.ninjas.cl/api/birds).
- Selección de ubicación manual o mediante mapa interactivo (Leaflet/OpenStreetMap).
- Visualización de información detallada de cada ave.
- Edición y eliminación de observaciones.
- Almacenamiento local de observaciones (LocalStorage).
- Interfaz responsiva para dispositivos móviles y escritorio.

## Instalación y uso
1. Clona o descarga este repositorio.
2. Abre la carpeta en VS Code o tu editor favorito.
3. Abre el archivo `estructura.html` en tu navegador (recomendado usar Live Server o algún servidor local para evitar problemas con AJAX).

## Dependencias
- [jQuery](https://jquery.com/)
- [Leaflet](https://leafletjs.com/) (incluido vía CDN)

## Estructura principal
- `estructura.html`: Estructura del formulario y la interfaz.
- `formulario.js`: Lógica de validación, interacción y CRUD.
- `estilo.css`: Estilos y responsividad.

## Créditos
- API de aves: [aves.ninjas.cl](https://aves.ninjas.cl)
- Mapa: [OpenStreetMap](https://www.openstreetmap.org/) + [Leaflet](https://leafletjs.com/)
