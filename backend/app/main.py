"""
Entry point of Fast API application
    - Creates the FastAPI app instance
    - Includes all routers
    - Configures CORS for frontend connection
    - Defines a health check endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, offices, availability, schedules

# Create FastAPI app
app = FastAPI(
    title="Shift Manager API",
    description="Employee shift scheduling application with AI-powered auto-scheduling",
    version="1.0.0"
)

# Configure CORS (allows frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(offices.router)
app.include_router(availability.router)
app.include_router(schedules.router)


@app.get("/", tags=["Health"])
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "app": "Shift Manager API",
        "version": "1.0.0"
    }