# backend/app/models/transactions.py

from app import db
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship


class Transaction(db.Model):
    """Model for storing payment transactions."""
    __tablename__ = 'transactions'

    transaction_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    subscription_id = Column(Integer, ForeignKey('user_subscriptions.subscription_id'), nullable=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default='USD')
    payment_method = Column(Enum('credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay'), nullable=False)
    payment_gateway_id = Column(String(255))
    status = Column(Enum('pending', 'completed', 'failed', 'refunded'), default='pending')
    description = Column(Text)
    invoice_number = Column(String(50), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship('User', back_populates='transactions')
    subscription = relationship('UserSubscription')

    def __repr__(self):
        return f'<Transaction {self.transaction_id} for user {self.user_id}>'