# Fantasy Futsal  
Final Degree Project – Computer Science (2026)

---

## 1. Introduction

Fantasy Futsal is a full-stack web application developed as a Final Degree Project in Computer Science. The system simulates a fantasy futsal league platform in which users create virtual teams composed of real players and earn points based on actual match performance.

The project focuses on backend architecture design, RESTful API implementation, authentication mechanisms, data persistence, event-driven scoring logic, and frontend-backend integration.

The system has been implemented following modular software engineering principles and separation of concerns between application layers.

---

## 2. Objectives

The main objectives of this project are:

- Design and implement a modular RESTful backend using Flask.
- Develop a modern frontend interface using React and Vite.
- Implement secure JWT-based authentication.
- Integrate MongoDB as a persistent data storage solution.
- Design an automated scoring engine for match event processing.
- Ensure maintainability, scalability, and clear architectural separation.
- Provide testing support for core functionalities.

---

## 3. System Architecture

The system follows a layered client-server architecture:

<img width="289" height="361" alt="image" src="https://github.com/user-attachments/assets/0b15e30d-7977-4797-a7ad-63fdb481234f" />

Client Layer  
- React + Vite frontend  
- API communication via HTTP  

Application Layer  
- Flask REST API  
- Route-based modular structure  
- Authentication middleware (JWT)  

Data Layer  
- MongoDB persistence layer  
- Separate logical databases:
  - FantasyLNFS (real players dataset)
  - FantasySystem (users, fantasy teams, competitions, rankings)

Processing Layer  
- Scoring engine (SistemaPuntuacion.py)

The architecture ensures clear separation between presentation logic, application logic, persistence, and data processing.

---

## 4. Technology Stack

### Backend
- Python 3.9+
- Flask
- PyMongo
- JWT Authentication
- Pytest
- Virtual environment (venv)

### Frontend
- React
- Vite
- Tailwind CSS
- Fetch API

### Database
- MongoDB (local or remote instance)

---

## 5. Database Architecture

The application uses MongoDB as its primary persistence layer.

Two logical databases are used:

### 5.1 FantasyLNFS
Stores real player information and related structured data.

### 5.2 FantasySystem
Stores fantasy-specific data such as:
- Users
- Fantasy teams
- Competitions
- Scores
- Leaderboards

The repository does not include database dumps or production datasets.  
This is intentional due to data volume, privacy considerations, and repository best practices.

To execute the application locally, a MongoDB instance must be running and properly configured.

---

## 6. Installation Requirements

- Python 3.9 or higher
- Node.js v16 or higher
- npm v8 or higher
- MongoDB installed and running locally (or accessible remotely)
- Windows PowerShell (recommended for backend execution)

---

## 7. Running the Application

### 7.1 Backend Execution

Navigate to the backend directory:

```powershell
cd WebPage/backend
```

Activate the virtual environment:

```powershell
.\venv\Scripts\activate
```

(Optional) Define MongoDB connection string:

```powershell
$env:MONGO_URI="mongodb://localhost:27017"
```

Start the Flask server:

```powershell
flask run
```

The backend will run at:

```
http://localhost:5000
```

---

### 7.2 Frontend Execution

Open a new terminal:

```bash
cd WebPage/frontend
npm run dev
```

The frontend will run at:

```
https://localhost:5173/
```

---

## 8. Project Structure

```
TFG/
│
├── WebPage/
│   ├── backend/
│   │   ├── app.py
│   │   ├── config.py
│   │   ├── __pycache__
│   │
│   └── frontend/
│       ├── src/
│       ├── pages/
│       ├── components/
│       └── services/
│
├── SistemaPuntuacion.py
├── JugadoresCadaEquipo.py
├── Test.py
├── Prueba.py
└── README.md
```

---

## 9. Core Functionalities

### 9.1 Authentication

<img width="373" height="94" alt="image" src="https://github.com/user-attachments/assets/1db9740f-a7a0-48b1-80ae-320a1a14cdcb" />


- User registration
- JWT token generation upon login
- Token validation middleware for protected routes

### 9.2 Team Management
- Retrieve available players
- Create fantasy teams
- Update team composition
- Retrieve team data

### 9.3 Competition Management
- Create competitions
- Join competitions
- Generate standings

### 9.4 Scoring and Ranking
- Automatic score calculation
- Ranking updates
- Leaderboard generation

---

## 10. Scoring Engine

The scoring engine is implemented in `SistemaPuntuacion.py`.

It processes match-related data and assigns points according to predefined rules.

<img width="660" height="181" alt="image" src="https://github.com/user-attachments/assets/926122a4-17d6-4a49-b75d-058a86be481d" />


### Scoring Rules

| **Aspecto** | **Estándar** | **Goles** | **Rendimiento Comunitario** | **Fair Play** |
|-------------|-------------|-----------|-----------------------------|---------------|
| Goles | 5 | 7 | 3 | 3 |
| Autogoles | -3 | -2 | -2 | -2 |
| Amarillas | -1 | -0.5 | -1 | -3 |
| Doble amarilla | -3 | -2 | -3 | -6 |
| Roja directa | -5 | -4 | -4 | -8 |
| Goles del equipo | 0.2 | 0.1 | 1.0 | 0.1 |
| Goles encajados | -0.2 | -0.1 | -1.0 | -0.1 |

**Team Result Points:**  
Victory = +3  
Draw = +1  
Defeat = +0
### Scoring Workflow

1. Match events are stored in the database.
2. The scoring engine processes relevant event data.
3. Points are calculated per player.
4. Fantasy team totals are updated.
5. Leaderboards are recalculated.

The scoring logic is configurable and separated from the API layer to ensure modularity.

---

## 11. API Overview

Authentication Endpoints:
- POST `/api/usuarios/registro`
- POST `/api/usuarios/login`

Team Endpoints:
- GET `/api/jugadores`
- POST `/api/equipo`
- PUT `/api/equipo/{id}`

Competition and Scoring:
- GET `/api/puntuacion/{equipo_id}`
- GET `/api/clasificacion/{competicion_id}`

All protected endpoints require a valid JWT token in the Authorization header.

---

## 12. Testing

Backend testing can be executed with:

```bash
cd WebPage/backend
python -m pytest tests/ -v
```

Additional validation scripts:

```bash
python Test.py
python Prueba.py
```

These scripts verify:
- Data integrity
- Scoring correctness
- Event parsing logic

---

## 13. Design Considerations

- Modular route-based backend architecture
- Clear separation between authentication and business logic
- Dedicated scoring engine for data processing
- Persistent storage via MongoDB
- Stateless API design using JWT
- Environment-based configuration support

---

## 14. Conclusion

Fantasy Futsal demonstrates the implementation of a modular full-stack web application integrating RESTful API architecture, JWT-based authentication, MongoDB persistence, and event-driven scoring logic.

The project reflects applied software engineering principles, database integration, and system design consistent with final-year academic standards.

---

## Author

Lucard2105  
Final Degree Project – Computer Science (2026)
