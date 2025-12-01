const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- ESTADO EN MEMORIA (Se borra si el servidor se reinicia) ---
let estadoSistema = {
    motorOn: false,
    pequenas: 0, medianas: 0, grandes: 0,
    sensors: { s1: false, s2: false, s3: false },
    lastDetection: { size: "", bits: "", time: "" }
};

let events = [];

// --- ENDPOINTS PARA EL ESP32 (El ESP32 llama aquí) ---

// 1. El ESP32 envía sus datos aquí constantemente
app.post('/esp/update', (req, res) => {
    const data = req.body;
    // Actualizamos sensores y contadores que vienen del ESP32
    estadoSistema.sensors = data.sensors;
    estadoSistema.pequenas = data.pequenas;
    estadoSistema.medianas = data.medianas;
    estadoSistema.grandes = data.grandes;

    if(data.lastDetection && data.lastDetection.size) {
        estadoSistema.lastDetection = data.lastDetection;
        // Agregamos al historial de eventos
        events.unshift({
            ts: new Date().toISOString(),
            size: data.lastDetection.size,
            bits: data.lastDetection.bits
        });
        if(events.length > 50) events.pop(); // Guardar solo los ultimos 50
    }

    // Respondemos al ESP32 diciéndole si el motor debe estar ON u OFF
    res.json({ motorCommand: estadoSistema.motorOn });
});

// --- ENDPOINTS PARA EL FRONTEND (Netlify llama aquí) ---

// 1. El Frontend pide el estado
app.get('/api/status', (req, res) => {
    res.json(estadoSistema);
});

// 2. El Frontend pide eventos
app.get('/api/events', (req, res) => {
    res.json({ events: events });
});

// 3. El Frontend prende motor
app.post('/api/motor/start', (req, res) => {
    estadoSistema.motorOn = true;
    res.json({ status: "motor_started" });
});

// 4. El Frontend apaga motor
app.post('/api/motor/stop', (req, res) => {
    estadoSistema.motorOn = false;
    res.json({ status: "motor_stopped" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});