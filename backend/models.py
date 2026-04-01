from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    roadmaps = relationship("SavedRoadmap", back_populates="owner")
    chat_sessions = relationship("ChatSession", back_populates="owner", cascade="all, delete-orphan")
    batch_reports = relationship("BatchReport", back_populates="owner", cascade="all, delete-orphan")

class SavedRoadmap(Base):
    __tablename__ = "saved_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    strengths = Column(JSON)
    missing_skills = Column(JSON)
    roadmap_plan = Column(JSON)

    owner = relationship("User", back_populates="roadmaps")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_role = Column(String, default="Backend Engineer")
    messages = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="chat_sessions")

class BatchReport(Base) :
    __tablename__ = "batch_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    results = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="batch_reports")
