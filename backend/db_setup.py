from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import uvicorn

import app

# Database setup
DATABASE_URL = f"postgresql+psycopg2://postgres:Eva%eva1407@localhost:5432/teachmate"  # Update with your actual database URL

engine = create_engine(DATABASE_URL)  # For SQLite
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def create_databases():
    Base.metadata.create_all(bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def drop_table():
    with engine.connect() as connection:
        connection.execute(text("DROP TABLE IF EXISTS homework"))

if __name__ == "__main__":
    # Drop the existing homework table
    drop_table()
    # Create new tables
    create_databases()
    print("Tables created successfully.")