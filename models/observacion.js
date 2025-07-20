const mongoose = require('mongoose');

const observacionSchema = new mongoose.Schema({
    nombreObservador: { type: String, required: true },
    email: { type: String, required: true, match: /.+\@.+\..+/ },
    fechaObservacion: { type: Date, required: true },
    ubicacion: {
        nombre: { type: String, required: true },
        coordenadas: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    ave: {
        id: { type: String, required: true },
        nombreEspanol: { type: String, required: true },
        nombreIngles: { type: String },
        nombreCientifico: { type: String },
        imagenUrl: { type: String }
    },
    comentarios: { type: String },
    fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Observacion', observacionSchema);