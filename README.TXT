Faja API – Backend para Sistema IoT de Faja Transportadora

Este backend proporciona la API que permite la comunicación entre el
ESP32, el frontend web y el servidor, gestionando el estado del sistema,
el control del motor y el registro de eventos de detección de cajas.

Características principales

-   Recibe datos en tiempo real desde el ESP32.
-   Expone endpoints REST para que el frontend consulte el estado.
-   Controla el estado del motor.
-   Mantiene un historial en memoria de los últimos 50 eventos.
-   Construido con Node.js + Express.

Tecnologías utilizadas

-   Node.js
-   Express
-   CORS
-   Body-Parser

Instalación

1.  Clonar el repositorio:

    git clone https://github.com/tu-repo/faja-api.git
    cd faja-api

2.  Instalar dependencias:

    npm install

3.  Iniciar el servidor:

    npm start

El servidor corre en http://localhost:3000

API Endpoints

Endpoints para el ESP32

POST /esp/update

El ESP32 envía el estado del sistema.

Body:

    {
      "sensors": { "s1": false, "s2": true, "s3": false },
      "pequenas": 3,
      "medianas": 1,
      "grandes": 0,
      "lastDetection": {
        "size": "mediana",
        "bits": "010",
        "time": "2025-01-10 12:00:00"
      }
    }

Respuesta:

    { "motorCommand": true }

------------------------------------------------------------------------

Endpoints para el Frontend

GET /api/status

Devuelve el estado actual del sistema.

GET /api/events

Devuelve los últimos 50 eventos registrados.

POST /api/motor/start

Activa el motor.

POST /api/motor/stop

Detiene el motor.

------------------------------------------------------------------------

Estado del sistema en memoria

    {
      "motorOn": false,
      "pequenas": 0,
      "medianas": 0,
      "grandes": 0,
      "sensors": { "s1": false, "s2": false, "s3": false },
      "lastDetection": { "size": "", "bits": "", "time": "" }
    }

Historial de eventos

Solo se guardan los últimos 50 eventos.

Autor

BERROSPI REYES HERNAN – 2025 Licencia MIT incluida en el repositorio.
