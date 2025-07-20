# formularioAves

Formulario web para el registro y gestión de observaciones de aves chilenas.

## Características
- Registro de observaciones con validación de datos.
- Selección de aves desde API pública (https://aves.ninjas.cl/api/birds).
- Selección de ubicación manual o mediante mapa interactivo (Leaflet/OpenStreetMap).
- Visualización de información detallada de cada ave.
- Edición y eliminación de observaciones.
- Almacenamiento y gestión de observaciones en MongoDB mediante API REST (Node.js/Express/Mongoose).
- Interfaz responsiva para dispositivos móviles y escritorio.

## Instalación y uso
1. Clona o descarga este repositorio.
2. Abre la carpeta en VS Code o tu editor favorito.
3. Asegúrate de tener el backend Node.js/Express corriendo (ver sección Backend/API).
4. Abre el archivo `estructura.html` en tu navegador (recomendado usar Live Server o algún servidor local para evitar problemas con AJAX).
## Backend/API

El proyecto incluye un backend Node.js/Express con MongoDB para almacenar y gestionar las observaciones.

- El endpoint principal es `/api/observaciones` para operaciones CRUD.
- El modelo de datos se define en `models/Observacion.js`.
- El backend debe estar corriendo para que la app funcione correctamente.

### Ejecución rápida del backend
1. Instala dependencias: `npm install`
2. Configura tu conexión MongoDB en `conexion.env`
3. Inicia el servidor: `node server.js`

La app web consumirá la API para todas las operaciones de observaciones.

## Dependencias
- [jQuery](https://jquery.com/)
- [Leaflet](https://leafletjs.com/) (incluido vía CDN)

- `estructura.html`: Estructura del formulario y la interfaz.
- `formulario.js`: Lógica de validación, interacción, integración con API y CRUD.
- `estilo.css`: Estilos y responsividad.
- `server.js`: Servidor Express y rutas API.
- `models/Observacion.js`: Esquema de observaciones para MongoDB.

## Créditos
- API de aves: [aves.ninjas.cl](https://aves.ninjas.cl)
- Mapa: [OpenStreetMap](https://www.openstreetmap.org/) + [Leaflet](https://leafletjs.com/)
- Backend: Node.js, Express, MongoDB, Mongoose
