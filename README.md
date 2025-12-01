# 🚀 **Faja API -- Backend para Sistema IoT de Faja Transportadora**

Bienvenido al backend oficial del proyecto **Faja Transportadora IoT**,
donde un **ESP32**, una **faja motorizada** y una **web en tiempo real**
trabajan juntos para clasificar cajas automáticamente.\
Este servidor es el puente entre *hardware* y *frontend*.

------------------------------------------------------------------------

## ✨ **Características principales**

-   🔄 Comunicación **ESP32 → Backend → Frontend**
-   📡 Recepción en tiempo real de sensores y detecciones
-   ⚙️ Control remoto del **motor** (ON/OFF)
-   📊 Historial de detecciones (hasta 50 eventos)
-   🧠 Estado del sistema gestionado en memoria
-   🛠️ Construido con **Node.js + Express**

------------------------------------------------------------------------

## 📁 **Estructura del proyecto**

    faja-api/
    ├── README.md
    ├── LICENSE
    ├── package.json
    └── server.js

------------------------------------------------------------------------

## 🛠️ **Instalación**

### 1️⃣ Clona el repositorio

``` bash
git clone https://github.com/tu-repo/faja-api.git
cd faja-api
```

### 2️⃣ Instala dependencias

``` bash
npm install
```

### 3️⃣ Inicia el servidor

``` bash
npm start
```

📌 Por defecto corre en:\
👉 **http://localhost:3000**

------------------------------------------------------------------------

# 🔌 **API -- Endpoints**

------------------------------------------------------------------------

## 🔧 **1. Endpoints para el ESP32**

### 📤 **POST /esp/update**

El ESP32 envía su estado y la última caja detectada.

**Body ejemplo:**

``` json
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
```

**Respuesta del servidor:**

``` json
{
  "motorCommand": true
}
```

------------------------------------------------------------------------

## 🖥️ **2. Endpoints para el Frontend**

------------------------------------------------------------------------

### 📊 **GET /api/status**

Obtiene el estado completo del sistema.

------------------------------------------------------------------------

### 📜 **GET /api/events**

Devuelve los últimos **50 eventos** de detección.

------------------------------------------------------------------------

### ▶️ **POST /api/motor/start**

Enciende el motor.

``` json
{ "status": "motor_started" }
```

------------------------------------------------------------------------

### ⏹️ **POST /api/motor/stop**

Apaga el motor.

``` json
{ "status": "motor_stopped" }
```

------------------------------------------------------------------------

# 🧠 **Estado interno del sistema**

El backend mantiene este estado en memoria:

``` js
{
  motorOn: false,
  pequenas: 0,
  medianas: 0,
  grandes: 0,
  sensors: { s1: false, s2: false, s3: false },
  lastDetection: { size: "", bits: "", time: "" }
}
```

⚠️ **Nota:** se borra al reiniciar el servidor (no usa base de datos).

------------------------------------------------------------------------