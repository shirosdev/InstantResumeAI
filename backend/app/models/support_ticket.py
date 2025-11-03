# backend/app/models/support_ticket.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Enum, ForeignKey
from sqlalchemy.orm import relationship

class SupportTicket(db.Model):
    """Model for storing user support inquiries from the contact form."""
    __tablename__ = 'support_tickets'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(Enum('unresolved', 'resolved'), nullable=False, default='unresolved')
    submitted_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # FIX: Add the resolved_at column to the model definition
    resolved_at = Column(TIMESTAMP, nullable=True)
    
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='SET NULL'), nullable=True)
    user = relationship('User', back_populates='support_tickets')
    replies = relationship('TicketReply', back_populates='ticket', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        """Convert ticket object to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'status': self.status,
            'submitted_at': self.submitted_at.isoformat() + 'Z',
            'resolved_at': self.resolved_at.isoformat() + 'Z' if self.resolved_at else None,
            'user_id': self.user_id
        }