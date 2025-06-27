# backend/run.py

from app import create_app, db
from app.models import User, SocialAuth, UserSession, ActivityLog, SubscriptionPlan, UserSubscription

# Create the Flask app instance at top-level — needed by Gunicorn
app = create_app()

# Only run this when executing the file directly (e.g., python run.py)
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database tables verified/created successfully")

    app.run(debug=True, host='0.0.0.0', port=5000)
