Purposes of the files:

app/
config.py: load environment variables
database.py: SQLAlchemy engine and session
models/*.py: SQLAlchemy models (users, office, availability, shift)
schemas/*.py: Pydantic request.response schemas
services/auth_service.py: password hashing, JWT creation
routers/auth.py: register/login endpoints
routers/pffices.py: create/join office endpoints
routers/availability.py: submit/view availabiity endpoints
services/ai_scheduler.py: generate/view schedule endpoints
main.py: FastAPI ap, include all routers