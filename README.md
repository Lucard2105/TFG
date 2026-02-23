# Fantasy Futsal

## Project Overview
Fantasy Futsal is a comprehensive web platform developed as a Final Degree Project (2026) that allows users to create virtual futsal teams composed of real players, earn points based on real match performance, and compete against other users in leagues and competitions.

The system integrates a Flask backend, a React + Vite frontend, and a JSON-based data architecture. It includes authentication with JWT, scoring automation, player management, competition rankings, and full RESTful API integration.

The main objective of the project is to implement a complete fantasy sports ecosystem while applying software engineering principles such as modular backend design, data validation, automated testing, and frontend-backend communication.

---

## Installation

### System Requirements
- Python 3.9 or higher
- Node.js v16 or higher
- npm v8 or higher
- Modern web browser

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/Lucard2105/TFG.git
```

2. Navigate to the project directory:
```bash
cd TFG
```

3. Backend Setup:
```bash
cd WebPage/backend
python -m venv venv
```

Activate virtual environment:

Windows:
```bash
.\venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend`:
```bash
DB_MODE=demo
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
```

Run backend:
```bash
flask run
```

4. Frontend Setup:
```bash
cd ../frontend
npm install
```

Create `.env.local`:
```bash
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Fantasy Futsal
```

Start development server:
```bash
npm run dev
```

---

## Usage

### Running the Application

Backend:
```bash
cd WebPage/backend
flask run
```

Frontend:
```bash
cd WebPage/frontend
npm run dev
```

Access the application at:
```
http://localhost:5173
```

---

## Features Overview

- User authentication with JWT tokens
- Player database stored in JSON format
- Fantasy team creation and management
- Real match event tracking
- Automatic scoring engine
- Competition standings and rankings
- RESTful API structure
- Unit and integration testing support

---

## Example Use Case

1. Register and log into the platform.
2. Browse available players.
3. Create a fantasy team selecting five players.
4. Wait for match events to be processed.
5. Check team score and leaderboard position.

---

## Configuration

### Backend Configuration

Configuration is managed in `config.py` and environment variables:

```python
DB_MODE = "demo"
FLASK_ENV = "development"
SECRET_KEY = "your-secret-key"
```

### Frontend Configuration

`.env.local`:

```javascript
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Fantasy Futsal
```

### Scoring Rules

Modify scoring rules in `SistemaPuntuacion.py`:

```python
SCORING_RULES = {
    'gol': 3,
    'asistencia': 1,
    'tarjeta_amarilla': -1,
    'tarjeta_roja': -3,
    'clean_sheet': 2,
    'destacado': 2
}
```

---

## API Documentation

### Authentication Endpoints

**POST** `/api/usuarios/registro`  
Registers a new user.

**POST** `/api/usuarios/login`  
Returns JWT token.

---

### Team Endpoints

**GET** `/api/jugadores`  
Retrieve all players.

**POST** `/api/equipo`  
Create a new team.

**GET** `/api/equipo/{equipo_id}`  
Retrieve team details.

**PUT** `/api/equipo/{equipo_id}`  
Update team information.

---

### Match and Scoring Endpoints

**GET** `/api/resultados`  
Retrieve match results.

**GET** `/api/eventos`  
Retrieve match events.

**GET** `/api/puntuacion/{equipo_id}`  
Retrieve team score.

**GET** `/api/clasificacion/{competicion_id}`  
Retrieve competition leaderboard.

---

## Contributing

1. Fork the repository.
2. Create a feature branch:
```bash
git checkout -b feature/YourFeature
```
3. Commit changes clearly.
4. Push your branch.
5. Open a Pull Request.

Code standards:
- Python follows PEP 8
- JavaScript uses ES6+
- Include tests for new features

---

## License

This project is licensed under the MIT License.
See the `LICENSE` file for details.

---

## Acknowledgments

- Futsal community
- Flask, React, Vite
- Open-source contributors

---

## Author

Lucard2105  
Computer Science Final Degree Project – 2026  
Status: Active Development  
Last Updated: February 23, 2026
