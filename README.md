# Shiftly

An AI-powered employee shift scheduling application. Employers create offices, employees submit their availability, and the system auto-generates optimal schedules using Claude AI.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Office Management**: Create offices and invite team members via unique invite codes
- **Availability Submission**: Employees submit weekly availability through an interactive grid
- **Calendar View**: Employers view all employee availability color-coded by team member
- **AI Scheduling**: Auto-generate optimal shift assignments using Claude AI
- **Role-Based Access**: Different views and permissions for employers and employees

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **Anthropic Claude API** - AI-powered schedule generation

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
shiftly/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Environment configuration
│   │   ├── database.py          # Database connection
│   │   ├── dependencies.py      # Auth dependencies
│   │   │
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── office.py
│   │   │   ├── office_member.py
│   │   │   ├── availability.py
│   │   │   └── shift.py
│   │   │
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── office.py
│   │   │   ├── availability.py
│   │   │   └── shift.py
│   │   │
│   │   ├── routers/             # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── offices.py
│   │   │   ├── availability.py
│   │   │   └── schedules.py
│   │   │
│   │   └── services/            # Business logic
│   │       ├── auth_service.py
│   │       └── ai_scheduler.py
│   │
│   ├── .env                     # Environment variables (not in git)
│   ├── .env.example             # Environment template
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AvailabilityGrid.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SubmitAvailability.jsx
│   │   │   └── ManageSchedule.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher
- Anthropic API key

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/shiftly.git
cd shiftly
```

### 2. Database Setup

Create the MySQL database and tables:

```sql
CREATE DATABASE shift_manager;
USE shift_manager;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE offices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    owner_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE office_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    office_id INT NOT NULL,
    role ENUM('employer', 'employee') NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (office_id) REFERENCES offices(id),
    UNIQUE KEY unique_membership (user_id, office_id)
);

CREATE TABLE availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    office_id INT NOT NULL,
    day_of_week TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (office_id) REFERENCES offices(id),
    INDEX idx_office_day (office_id, day_of_week)
);

CREATE TABLE shifts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    office_id INT NOT NULL,
    user_id INT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (office_id) REFERENCES offices(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

Edit `.env` file:
```
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/shift_manager
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ANTHROPIC_API_KEY=your-anthropic-api-key
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

### For Employers

1. **Register** a new account
2. **Create an Office** from the dashboard
3. **Share the Invite Code** with your employees
4. **View Team Availability** - see all employees' available times color-coded
5. **Generate Schedule** - use AI to auto-assign shifts based on availability
6. **Review and Publish** - view the generated schedule

### For Employees

1. **Register** a new account
2. **Join an Office** using the invite code from your employer
3. **Submit Availability** - click on time slots when you're available to work
4. **View Schedule** - see your assigned shifts

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |

### Offices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/offices` | Create new office |
| GET | `/offices` | List user's offices |
| POST | `/offices/join` | Join office with invite code |
| GET | `/offices/{id}/members` | List office members (employer only) |

### Availability
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/offices/{id}/availability` | Submit availability |
| GET | `/offices/{id}/availability/me` | Get my availability |
| GET | `/offices/{id}/availability/all` | Get all availability (employer only) |

### Schedules
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/offices/{id}/schedule/generate` | AI generate schedule |
| GET | `/offices/{id}/schedule` | Get schedule for a week |
| POST | `/offices/{id}/shifts` | Manually create shift |
| DELETE | `/shifts/{id}` | Delete a shift |

## AI Schedule Generation

The AI scheduler uses Claude to generate optimal shift assignments based on:

- Employee availability
- Shift requirements (day, time, minimum workers)
- Fair distribution of hours

The AI follows these rules:
1. Only assigns employees to shifts during their available times
2. Meets minimum worker requirements for each shift
3. Distributes shifts fairly among employees
4. Prevents overlapping shift assignments

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `SECRET_KEY` | JWT signing key |
| `ALGORITHM` | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time |
| `ANTHROPIC_API_KEY` | Claude API key for AI scheduling |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Email notifications for schedule updates
- [ ] Shift swap requests between employees
- [ ] Mobile app (React Native)
- [ ] Calendar integrations (Google Calendar, Outlook)
- [ ] Time-off requests
- [ ] Shift templates for recurring schedules
- [ ] Analytics dashboard
- [ ] Export schedules to PDF/CSV



## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [Anthropic Claude](https://www.anthropic.com/) - AI scheduling engine
- [Vite](https://vitejs.dev/) - Frontend build tool
