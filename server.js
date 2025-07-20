const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Observacion = require('./models/observacion');
const dotenv = require('dotenv');
dotenv.config({ path: './conexion.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB usando variable de entorno
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error de conexión:', err));

// Operaciones CRUD
app.get('/api/observaciones', async (req, res) => {
    try {
        const observaciones = await Observacion.find();
        res.json(observaciones);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/observaciones', async (req, res) => {
    // Adaptar para aceptar ubicacion y ave como string si vienen así del frontend
    let data = req.body;
    // Si ubicacion es string, convertir a objeto
    if (typeof data.ubicacion === 'string') {
        data.ubicacion = { nombre: data.ubicacion };
    }
    // Si aveId y aveNombre existen, crear objeto ave
    if (data.aveId && data.aveNombre) {
        data.ave = {
            id: data.aveId,
            nombreEspanol: data.aveNombre
        };
    }
    const observacion = new Observacion(data);
    try {
        const nuevaObservacion = await observacion.save();
        res.status(201).json(nuevaObservacion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/observaciones/:id', async (req, res) => {
    // Adaptar para aceptar ubicacion y ave como string si vienen así del frontend
    let data = req.body;
    if (typeof data.ubicacion === 'string') {
        data.ubicacion = { nombre: data.ubicacion };
    }
    if (data.aveId && data.aveNombre) {
        data.ave = {
            id: data.aveId,
            nombreEspanol: data.aveNombre
        };
    }
    try {
        const observacion = await Observacion.findByIdAndUpdate(req.params.id, data, { new: true });
        res.json(observacion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/observaciones/:id', async (req, res) => {
    try {
        await Observacion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Observación eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));