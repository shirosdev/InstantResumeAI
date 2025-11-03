# backend/app/models/ticket_reply.py
from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship

class TicketReply(db.Model):
    __tablename__ = 'ticket_replies'

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey('support_tickets.id', ondelete='CASCADE'), nullable=False)
    # FIX: user_id can be NULL if the reply is from the original user via contact form
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=True)
    reply_message = Column(Text, nullable=False)
    sent_at = Column(TIMESTAMP, default=datetime.utcnow)

    ticket = relationship('SupportTicket', back_populates='replies')
    author = relationship('User')

    def to_dict(self):
        # FIX: Determine author name based on whether it's an admin or the original user
        author_name = self.author.username if self.author else self.ticket.name
        is_admin_reply = True if self.author else False

        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'author_name': author_name,
            'is_admin_reply': is_admin_reply,
            'reply_message': self.reply_message,
            'sent_at': self.sent_at.isoformat() + 'Z'
        }