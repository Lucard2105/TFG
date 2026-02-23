# Fantasy Futsal  
Final Degree Project – Computer Science (2026)

---

## 1. Introduction

Fantasy Futsal is a full-stack web application developed as a Final Degree Project in Computer Science. The system simulates a fantasy futsal league in which users create virtual teams composed of real players and earn points based on real match events.

The project demonstrates applied knowledge in backend architecture, RESTful API design, authentication mechanisms, data processing, automated scoring systems, and frontend-backend integration.

The application has been designed following modular and maintainable software engineering principles.

---

## 2. Project Scope and Objectives

The primary objectives of this project are:

- Design and implement a modular RESTful backend using Flask.
- Develop a reactive frontend interface using React and Vite.
- Implement JWT-based authentication for secure access control.
- Create a configurable scoring engine that processes real match events.
- Ensure separation of concerns between presentation, application, and data layers.
- Provide testing support for core functionalities.

---

## 3. System Architecture

The system follows a client-server architecture with clear separation of responsibilities:

### 3.1 Client Layer
- React + Vite
- Tailwind CSS
- Fetch-based API communication

### 3.2 Application Layer
- Flask REST API
- Route-based modular structure
- Middleware for authentication
- Configurable environment-based behavior

### 3.3 Data Layer
- Structured JSON files:
  - `Jugadores.json`
  - `Eventos.json`
  - `Resultados.json`
- Scoring engine (`SistemaPuntuacion.py`)

Communication between frontend and backend is performed via HTTP using RESTful conventions.

---

## 4. Technology Stack

### Backend
- Python 3.9+
- Flask
- JWT Authentication
- Pytest (testing framework)
- Virtual environment (venv)

### Frontend
- React
- Vite
- Tailwind CSS
- npm

---

## 5. Installation and Execution

### 5.1 System Requirements

- Python 3.9 or higher
- Node.js v16 or higher
- npm v8 or higher
- Windows PowerShell (recommended for backend setup)

---

## 6. Running the Application

### 6.1 Backend Execution

Navigate to the backend directory:

```powershell
cd WebPage/backend
```

Activate the virtual environment and set the execution mode:

```powershell
.\venv\Scripts\activate
$env:DB_MODE="demo"
flask run
```

The backend server will run at:

```
http://localhost:5000
```

The environment variable `DB_MODE="demo"` configures the application to use JSON-based storage instead of an external database.

---

### 6.2 Frontend Execution

Open a new terminal and navigate to the frontend directory:

```bash
cd WebPage/frontend
npm run dev
```

The frontend application will be available at:

```
https://localhost:5173/
```

---

## 7. Project Structure

```
TFG/
│
├── WebPage/
│   ├── backend/
│   │   ├── app.py
│   │   ├── config.py
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── requirements.txt
│   │
│   └── frontend/
│       ├── src/
│       ├── pages/
│       ├── components/
│       ├── services/
│       └── main.jsx
│
├── Jugadores.json
├── Eventos.json
├── Resultados.json
├── SistemaPuntuacion.py
├── JugadoresCadaEquipo.py
├── Test.py
├── Prueba.py
└── README.md
```

---

## 8. Core Functionalities

### 8.1 Authentication
- User registration
- Login with JWT token generation
- Protected routes using token validation middleware

### 8.2 Team Management
- Retrieve available players
- Create fantasy teams
- Update team composition
- Retrieve team data

### 8.3 Match and Event Management
- Retrieve match results
- Retrieve event data
- Automatic scoring updates

### 8.4 Ranking System
- Calculate total team points
- Compute standings per competition
- Provide structured leaderboard output

---

## 9. Scoring Engine

The scoring system is implemented in `SistemaPuntuacion.py`.

The engine processes match events from `Eventos.json` and assigns points according to predefined rules:

| Event Type              | Points |
|-------------------------|--------|
| Goal                    | +3     |
| Assist                  | +1     |
| Yellow Card             | -1     |
| Red Card                | -3     |
| Clean Sheet             | +2     |
| Outstanding Performance | +1 to +3 |

### Scoring Workflow

1. Match event is recorded.
2. Event is parsed by the scoring engine.
3. Points are calculated based on event type.
4. Team totals are updated.
5. Leaderboard is recalculated.

The scoring configuration can be modified directly within the engine to adapt rule parameters.

---

## 10. Testing

### Backend Testing

Run backend tests:

```bash
cd WebPage/backend
python -m pytest tests/ -v
```

### Script-Based Validation

Additional validation scripts:

```bash
python Test.py
python Prueba.py
```

These scripts validate:
- Data integrity
- Scoring correctness
- Event parsing logic

---

## 11. Configuration

Backend behavior can be modified using environment variables:

```
DB_MODE=demo
FLASK_ENV=development
```

Frontend API endpoint configuration is managed in:

```
WebPage/frontend/.env.local
```

Example:

```
VITE_API_URL=http://localhost:5000
```

---

## 12. Design Considerations

- Modular route-based backend structure
- Separation of authentication middleware
- Clear division between data processing and presentation
- JSON-based storage for simplified deployment
- Extensible scoring logic

---

## 13. Limitations

- JSON storage limits scalability
- No production database integration
- No real-time event streaming
- No containerization or cloud deployment implemented

---

## 14. Future Improvements

- Migration to relational database (PostgreSQL)
- Docker containerization
- Continuous Integration pipeline
- Real-time scoring updates via WebSockets
- Cloud deployment (AWS/Azure)

---

## 15. Conclusion

Fantasy Futsal demonstrates the implementation of a full-stack web application following modular design principles and RESTful architecture. The project integrates authentication, event-driven scoring logic, structured data processing, and client-server communication within a cohesive and maintainable system.

The application reflects applied software engineering knowledge and practical system design skills consistent with final-year academic standards.

---

## Author

Lucard2105  
Final Degree Project – Computer Science (2026)
