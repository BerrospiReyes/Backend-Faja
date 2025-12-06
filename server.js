const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- ESTADO DEL SISTEMA ---
let estadoSistema = {
    motorOn: false,
    pequenas: 0, medianas: 0, grandes: 0,
    sensors: { s1: false, s2: false, s3: false },
    lastDetection: { size: "", bits: "", time: "" }
};

// --- CONFIGURACIÓN MANUAL (NUEVO) ---
// Aquí guardaremos lo que elijas en el Frontend
let configManual = {
    activa: false,      // ¿Usamos datos falsos?
    fecha: "",          // "2023-12-25"
    turno: "Mañana"     // "Noche"
};

let events = [];
const MAX_EVENTS = 1000; 

// --- ENDPOINT PARA RECIBIR LA CONFIGURACIÓN DEL FRONTEND (NUEVO) ---
app.post('/api/config', (req, res) => {
    // El frontend nos manda: { activa: true, fecha: "2024-01-01", turno: "Noche" }
    configManual = req.body;
    console.log("Configuración actualizada:", configManual);
    res.json({ status: "ok", config: configManual });
});

// --- ENDPOINT ESP32 (MODIFICADO) ---
app.post('/esp/update', (req, res) => {
    const data = req.body;
    
    estadoSistema.sensors = data.sensors;
    estadoSistema.pequenas = data.pequenas;
    estadoSistema.medianas = data.medianas;
    estadoSistema.grandes = data.grandes;

    if(data.lastDetection && data.lastDetection.size) {
        estadoSistema.lastDetection = data.lastDetection;
        
        let fechaFinalISO = "";
        let turnoFinal = "";

        const now = new Date(); // Hora real actual del servidor

        // === AQUÍ ESTÁ LA MAGIA ===
        if (configManual.activa) {
            // 1. MODO MANUAL: Usamos lo que tú dijiste
            turnoFinal = configManual.turno;

            // Para la fecha, combinamos TU fecha manual con la HORA actual
            // para que los eventos sigan teniendo orden cronológico en el gráfico
            // configManual.fecha viene como "YYYY-MM-DD"
            if(configManual.fecha) {
                const horaReal = now.toISOString().split('T')[1]; // "14:30:00.000Z"
                fechaFinalISO = `${configManual.fecha}T${horaReal}`;
            } else {
                fechaFinalISO = now.toISOString();
            }

        } else {
            // 2. MODO AUTOMÁTICO (REAL): Calculamos como antes
            
            // Ajuste Zona Horaria Perú/Colombia (UTC-5)
            const options = { timeZone: 'America/Lima', hour: 'numeric', hour12: false };
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const horaPeru = parseInt(formatter.format(now));

            if (horaPeru >= 6 && horaPeru < 14) turnoFinal = "Mañana";
            else if (horaPeru >= 14 && horaPeru < 22) turnoFinal = "Tarde";
            else turnoFinal = "Noche";

            fechaFinalISO = now.toISOString();
        }

        // Guardamos el evento
        events.unshift({
            ts: fechaFinalISO,   // Fecha (Real o Falsa)
            size: data.lastDetection.size,
            bits: data.lastDetection.bits,
            turno: turnoFinal    // Turno (Real o Falso)
        });

        if(events.length > MAX_EVENTS) events.pop();
    }

    res.json({ motorCommand: estadoSistema.motorOn });
});

// --- RESTO DE ENDPOINTS (IGUAL QUE SIEMPRE) ---
app.get('/api/status', (req, res) => res.json(estadoSistema));
app.get('/api/events', (req, res) => res.json({ events: events }));
app.post('/api/motor/start', (req, res) => { estadoSistema.motorOn = true; res.json({status:"ok"}); });
app.post('/api/motor/stop', (req, res) => { estadoSistema.motorOn = false; res.json({status:"ok"}); });
app.post('/api/events/clear', (req, res) => { events = []; res.json({status:"ok"}); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server en ${PORT}`));