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

// --- ENDPOINTS PARA EL ESP32 ---

// AUMENTAMOS EL LIMITE DE MEMORIA
// Como no usas Base de Datos, si Render se reinicia, esto se borra.
// Pero aumentamos a 1000 para que el filtro de fecha tenga sentido en la demo.
const MAX_EVENTS = 1000; 

app.post('/esp/update', (req, res) => {
    const data = req.body;
    
    // Actualizamos estado actual
    estadoSistema.sensors = data.sensors;
    estadoSistema.pequenas = data.pequenas;
    estadoSistema.medianas = data.medianas;
    estadoSistema.grandes = data.grandes;

    if(data.lastDetection && data.lastDetection.size) {
        estadoSistema.lastDetection = data.lastDetection;
        
        // --- LOGICA DE TURNO AUTOMÁTICO ---
        // Definimos turnos por hora del servidor:
        // Mañana: 06:00 - 14:00
        // Tarde: 14:00 - 22:00
        // Noche: 22:00 - 06:00
        const now = new Date();
        const hora = now.getHours(); // Hora del 0 al 23
        let turnoActual = "Noche";

        if (hora >= 6 && hora < 14) {
            turnoActual = "Mañana";
        } else if (hora >= 14 && hora < 22) {
            turnoActual = "Tarde";
        }

        // Agregamos al historial con el campo 'turno'
        events.unshift({
            ts: now.toISOString(),
            size: data.lastDetection.size,
            bits: data.lastDetection.bits,
            turno: turnoActual // <--- NUEVO CAMPO
        });

        // Mantenemos el historial controlado
        if(events.length > MAX_EVENTS) events.pop();
    }

    res.json({ motorCommand: estadoSistema.motorOn });
});

// --- ENDPOINTS PARA EL FRONTEND ---

// Estado
app.get('/api/status', (req, res) => {
    res.json(estadoSistema);
});

// 2. El Frontend pide eventos
app.get('/api/events', (req, res) => {
    res.json({ events: events });
});

// Prende motor
app.post('/api/motor/start', (req, res) => {
    estadoSistema.motorOn = true;
    console.log('Motor ENCENDIDO desde frontend');
    res.json({ status: "motor_started", motorCommand: true });
});

//  Apaga motor
app.post('/api/motor/stop', (req, res) => {
    estadoSistema.motorOn = false;
    console.log('Motor APAGADO desde frontend');
    res.json({ status: "motor_stopped", motorCommand: false });
});

// Limpiar eventos desde el frontend
app.post('/api/events/clear', (req, res) => {
    events = [];
    console.log('Eventos limpiados');
    res.json({ status: "events_cleared", count: 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Servidor corriendo en puerto ${PORT}`);
});