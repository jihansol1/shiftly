# Shift Manager

A web application for managing employee shift schedules. Employers create offices, employees submit their availability, and the system can auto-generate schedules using AI.

## Features

- **Authentication**: User registration and login with JWT tokens
- **Office Management**: Create offices and invite employees via invite code
- **Availability Submission**: Employees submit weekly availability
- **Calendar View**: Employers view all employee availability in one place
- **AI Scheduling**: Auto-generate shift assignments using Claude API

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: MySQL
- **AI**: Anthropic Claude API
- **Frontend**: React (coming soon)

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/shift-manager.git
cd shift-manager
```

### 2. Set up the backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Create MySQL database
```sql
CREATE DATABASE shift_manager;
```

### 4. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

### 5. Run the server
```bash
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`

## Project Structure
```
backend/
├── app/
│   ├── main.py           # FastAPI app entry
│   ├── config.py         # Environment config
│   ├── database.py       # MySQL connection
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── routers/          # API endpoints
│   └── services/         # Business logic
└── requirements.txt
```
