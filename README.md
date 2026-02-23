# Fantasy Futsal

## Project Overview
Fantasy Futsal is a dynamic and engaging futsal management simulation game that allows players to create and manage their own futsal teams, compete with others, and track performance statistics in real-time. The aim of the project is to provide an immersive experience for futsal enthusiasts while enhancing analytical skills through data management and strategy application. 

## Installation
### System Requirements
- Node.js v14 or higher
- MongoDB v4 or higher
- A reliable internet connection

### Installation Steps
1. Clone the repository: 
   ```bash
   git clone https://github.com/Lucard2105/TFG.git
   ```
2. Navigate to the project directory:
   ```bash
   cd TFG
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up the database:
   - Make sure MongoDB is running locally or provide connection details for a cloud instance.

## Usage
### Running the Application
To start the application, run:
```bash
npm start
```
Navigate to `http://localhost:3000` in your browser to access the application.

### Features Overview
- Team management: Create and customize your futsal team.
- Match Simulation: Simulate matches and view outcomes.
- Leaderboard: Track scores and team rankings.
- Player Statistics: Review detailed player performance metrics.

### Example Use Case
1. Create an account and log in.
2. Assemble your team using the player database.
3. Simulate a match and analyze the results.

## Configuration
### Configuration Options
Modify the `config.js` file for different settings like database URI and server ports. Example:
```javascript
const config = {
    dbURI: "mongodb://localhost:27017/fantasyfutsal",
    serverPort: 3000
};
```

## API Documentation
### Endpoints
- **GET** `/api/teams` - Retrieve all teams.
- **POST** `/api/matches/simulate` - Simulate a match between two teams.

### Request/Response Formats
- **POST** `/api/matches/simulate` sample request:
```json
{
  "teamA": "Team Name A",
  "teamB": "Team Name B"
}
```

## Contributing
We welcome contributions to the Fantasy Futsal project. Please follow the [contribution guidelines](CONTRIBUTING.md) for more details.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
Thanks to all contributors and the open-source community for their support.
