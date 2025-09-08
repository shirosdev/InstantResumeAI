# backend/app/models/api_log.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime

class ApiLog(db.Model):
    """Model for logging API request performance."""
    __tablename__ = 'api_logs'

    id = Column(Integer, primary_key=True)
    endpoint = Column(String(255), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False, index=True)
    response_time_ms = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<ApiLog {self.method} {self.endpoint} -> {self.status_code}>'