const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Observacion = require('./models/observacion');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
mongoose.connect('mongodb+srv://usuario:password@cluster0.mongodb.net/avesDB?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB Atlas'))
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
    const observacion = new Observacion(req.body);
    try {
        const nuevaObservacion = await observacion.save();
        res.status(201).json(nuevaObservacion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/observaciones/:id', async (req, res) => {
    try {
        const observacion = await Observacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
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