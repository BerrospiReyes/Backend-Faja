const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- ESTADO EN MEMORIA ---
let estadoSistema = {
    motorOn: false,
    pequenas: 0, medianas: 0, grandes: 0,
    sensors: { s1: false, s2: false, s3: false },
    lastDetection: { size: "", bits: "", time: "" }
};

let events = [];
const MAX_EVENTS = 1000; 

// --- ENDPOINTS PARA EL ESP32 ---
app.post('/esp/update', (req, res) => {
    const data = req.body;
    
    // Actualizamos estado actual
    estadoSistema.sensors = data.sensors;
    estadoSistema.pequenas = data.pequenas;
    estadoSistema.medianas = data.medianas;
    estadoSistema.grandes = data.grandes;

    if(data.lastDetection && data.lastDetection.size) {
        estadoSistema.lastDetection = data.lastDetection;
        
        // --- CORRECCIÓN DE HORA Y TURNO (ZONA HORARIA LOCAL) ---
        const now = new Date();
        
        // Obtenemos la hora en formato 24h de la zona horaria 'America/Lima' (UTC-5)
        // Esto arregla el problema de que Render tenga otra hora
        const options = { timeZone: 'America/Lima', hour: 'numeric', hour12: false };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const horaPeru = parseInt(formatter.format(now));

        // Calculamos turno basado en hora Perú
        let turnoActual = "Noche";
        if (horaPeru >= 6 && horaPeru < 14) {
            turnoActual = "Mañana";
        } else if (horaPeru >= 14 && horaPeru < 22) {
            turnoActual = "Tarde";
        }

        // Agregamos al historial
        events.unshift({
            ts: now.toISOString(),          // Guardamos fecha técnica (UTC)
            size: data.lastDetection.size,
            bits: data.lastDetection.bits,
            turno: turnoActual              // <--- TURNO CALCULADO CON HORA PERÚ
        });

        if(events.length > MAX_EVENTS) events.pop();
    }

    res.json({ motorCommand: estadoSistema.motorOn });
});

// --- ENDPOINTS FRONTEND (IGUAL QUE ANTES) ---
app.get('/api/status', (req, res) => res.json(estadoSistema));
app.get('/api/events', (req, res) => res.json({ events: events }));

app.post('/api/motor/start', (req, res) => {
    estadoSistema.motorOn = true;
    res.json({ status: "motor_started", motorCommand: true });
});

app.post('/api/motor/stop', (req, res) => {
    estadoSistema.motorOn = false;
    res.json({ status: "motor_stopped", motorCommand: false });
});

app.post('/api/events/clear', (req, res) => {
    events = [];
    res.json({ status: "events_cleared", count: 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});