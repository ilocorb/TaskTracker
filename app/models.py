from .database import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    is_admin = db.Column(db.Boolean, default=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username
        }

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_done = db.Column(db.Boolean, default=False, nullable=False)
    priority = db.Column(db.String(20), default='medium', nullable=False)
    due_date = db.Column(db.String(20), nullable=True) # Storing as string to match previous schema simple text storage
    tags = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "is_done": self.is_done,
            "priority": self.priority,
            "due_date": self.due_date,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user_id": self.user_id
        }
