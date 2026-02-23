# Project Title

A brief description of your project and its purpose.

## Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lucard2105/TFG.git
   cd TFG
   ```

2. **Create and activate a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install requirements**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   You may need to create a `.env` file in the root directory of the project and add your environment variables like this:
   ```plaintext
   FLASK_APP=app.py
   FLASK_ENV=development
   DATABASE_URL=your_database_url
   SECRET_KEY=your_secret_key
   ```

5. **Run the backend**
   ```bash
   flask run
   ```

## Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.