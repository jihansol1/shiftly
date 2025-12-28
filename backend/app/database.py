"""
purpose of this file is to set up the connection between Python and MySQL database using SQLAlchemy
Creates: 
    1) Engine - connection to MySQL
    2) SessionLocal - a factory that creates database sessions for each request
    3) Base - a class that all your models will inherit from 
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# create engine = the connection to MySQL
# pool_pre_ping=True checks if connection is alive before using it
engine = create_engine(
    settings.database_url, 
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False, # Do not auto commit
    autoflush=False,  # Do not auto-flush
    bind=engine       # bind session to the engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        # provide session to the route
        yield db
    finally:
        # always close when done
        db.close()