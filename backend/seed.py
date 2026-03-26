from app import app
from extensions import db, bcrypt
from models import User, Meeting, Folder
from datetime import datetime

with app.app_context():

    #  Clear existing data
    Meeting.query.delete()
    Folder.query.delete()
    User.query.delete()

    # Hash password
    hashed_password = bcrypt.generate_password_hash("password123").decode('utf-8')

    # Create user
    user1 = User(
        name="Faith",
        email="faith@example.com",
        password=hashed_password
    )

    db.session.add(user1)
    db.session.commit()

    # Create folders
    folder1 = Folder(name="Work Meetings", user_id=user1.id)
    folder2 = Folder(name="Personal", user_id=user1.id)

    db.session.add_all([folder1, folder2])
    db.session.commit()

    # Create meetings
    meeting1 = Meeting(
        title="Team Sync",
        duration=30,
        audio_url="http://example.com/audio1.mp3",
        summary="Discussed project progress",
        transcript="We talked about the next steps...",
        scheduled_time=datetime.utcnow(),
        status="completed",
        user_id=user1.id,
        folder_id=folder1.id
    )

    meeting2 = Meeting(
        title="Doctor Appointment",
        duration=15,
        scheduled_time=datetime.utcnow(),
        status="scheduled",
        user_id=user1.id,
        folder_id=folder2.id
    )

    db.session.add_all([meeting1, meeting2])
    db.session.commit()

    print(" Database seeded with hashed passwords!")