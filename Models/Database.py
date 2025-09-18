from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URI = r"mssql+pyodbc://DESKTOP-04FQ9HU\SQLEXPRESS?trusted_connection=yes&driver=ODBC+Driver+18+for+SQL+Server&database=ExpenseTrackerFastApi&TrustServerCertificate=yes"
engine = create_engine(SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_table():
    Base.metadata.create_all(bind=engine)


