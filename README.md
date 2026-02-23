# 🏅 Fantasy Futsal - TFG

Proyecto de Trabajo Fin de Grado que implementa una **plataforma web de Fantasy Futsal** con backend en Flask y frontend moderno.

## 📋 Descripción del Proyecto

Fantasy Futsal es una aplicación web que permite a los usuarios:
- Participar en ligas de Fantasy Futsal
- Gestionar equipos virtuales con jugadores reales
- Obtener puntuaciones basadas en eventos de los partidos
- Competir contra otros jugadores

### Componentes Principales

- **Backend**: API REST en Flask (Python)
- **Frontend**: Aplicación web moderna (JavaScript/Node.js)
- **Datos**: Ficheros JSON con información de eventos, jugadores, resultados

## 🗂️ Estructura del Proyecto

```
TFG/
├── backend/                    # API REST en Flask
│   ├── venv/                  # Entorno virtual Python
│   └── ...
├── WebPage/                   # Frontend de la aplicación
│   ├── src/
│   ├── package.json
│   └���─ ...
├── Eventos.json
├── Jugadores.json
├── Resultados.json
├── JugadoresCadaEquipo.py
├── SistemaPuntuacion.py
├── Test.py
└── README.md
```

## 🚀 Instalación y Setup

### Requisitos Previos

- **Python** 3.8 o superior
- **Node.js** 16 o superior y **npm**
- **Git**

### Backend - Flask

#### 1. Crear y activar el entorno virtual

```bash
cd backend
.\venv\Scripts\activate
```

#### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

#### 3. Configurar variables de entorno

```bash
$env:DB_MODE="demo"
```

Valores disponibles para `DB_MODE`:
- `"demo"` - Modo demostración con datos de ejemplo
- `"prod"` - Modo producción

#### 4. Ejecutar el servidor

```bash
flask run
```

El servidor estará disponible en `http://localhost:5000`

### Frontend - Node.js

#### 1. Instalación de dependencias

```bash
cd WebPage
npm install
```

#### 2. Ejecutar servidor de desarrollo

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173` (o el puerto que indique)

## 📚 Estructura de Datos

### Jugadores.json
Contiene la información de todos los jugadores participantes:
- ID del jugador
- Nombre y apellidos
- Equipo actual
- Posición
- Estadísticas personales

### Eventos.json
Registro de eventos que ocurren en los partidos:
- Goles
- Asistencias
- Tarjetas
- Actuaciones destacadas

### Resultados.json
Resultados finales de los partidos:
- Equipos enfrentados
- Marcador
- Fecha y hora
- Jugadores destacados

## 🔧 Scripts Python

### JugadoresCadaEquipo.py
Procesa y organiza los jugadores por equipos.

```bash
python JugadoresCadaEquipo.py
```

### SistemaPuntuacion.py
Implementa la lógica de cálculo de puntuaciones basada en eventos.

```bash
python SistemaPuntuacion.py
```

### Test.py
Ejecución de tests unitarios:

```bash
python Test.py
```

## 🧪 Testing

Para ejecutar los tests:

```bash
python -m pytest Test.py
```

O usando unittest:

```bash
python Test.py
```

## 🌐 API Endpoints

- `GET /api/jugadores` - Obtener lista de jugadores
- `GET /api/resultados` - Obtener resultados de partidos
- `GET /api/eventos` - Obtener eventos de partidos
- `POST /api/equipo` - Crear nuevo equipo
- `GET /api/puntuacion/<equipo_id>` - Obtener puntuación de un equipo

## 🛠️ Desarrollo

### Cambios en el Frontend

```bash
cd WebPage
npm run dev      # Para desarrollo con hot reload
npm run build    # Para crear compilación de producción
```

### Cambios en el Backend

1. El servidor Flask se recarga automáticamente en modo desarrollo
2. Para cambios en dependencias: `pip install -r requirements.txt`

## 📝 Notas de Desarrollo

- Asegúrate de que el entorno virtual de Python esté activado antes de ejecutar comandos de Flask
- La carpeta `__pycache__` se genera automáticamente y no debe ser modificada
- Los archivos JSON contienen datos importantes - realiza copias de seguridad antes de modificarlos

## 🐛 Troubleshooting

### Error: "No module named 'flask'"

```bash
.\venv\Scripts\activate
pip install flask
```

### Error: "npm: command not found"

Instala Node.js desde https://nodejs.org/

### Puerto ya en uso

- Backend (5000): `flask run --port 5001`
- Frontend: El puerto será asignado automáticamente

## 📄 Licencia

Este proyecto es parte de un Trabajo Fin de Grado.

## 👤 Autor

**Lucard2105**

---

**Última actualización**: Febrero 2026