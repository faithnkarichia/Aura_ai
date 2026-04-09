# user model
# folders model
# meetings model
from extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__= "users"
    id= db.Column(db.Integer, primary_key=True)
    name= db.Column(db.String(100), nullable= False)
    email=db.Column(db.String(100), nullable= False, unique= True)
    password= db.Column(db.String(100), nullable= False)
    meetings= db.relationship("Meeting", backref= "user", lazy= True)
    folders= db.relationship("Folder", backref= "user", lazy= True)




class Meeting(db.Model):
    __tablename__= "meetings"
    id= db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable= False)
    created_at= db.Column(db.DateTime,default= datetime.utcnow, nullable = False)
    duration= db.Column(db.String(50), nullable= False)
    audio_url = db.Column(db.String(255), nullable=True)
    summary= db.Column(db.Text, nullable= True)
    transcript= db.Column(db.Text, nullable= True)
    
    scheduled_time= db.Column(db.DateTime, nullable= True)
    status= db.Column(db.String(50), nullable= False, default= "scheduled")
    user_id= db.Column(db.Integer, db.ForeignKey("users.id"), nullable= False)
    folder_id = db.Column(db.Integer, db.ForeignKey("folders.id"), nullable=True)
 


class Folder(db.Model):
    __tablename__= "folders"
    id= db.Column(db.Integer, primary_key=True)
    name= db.Column(db.String(100), nullable= False)
    user_id= db.Column(db.Integer, db.ForeignKey("users.id"), nullable= False)
    meetings = db.relationship("Meeting", backref="folder", lazy=True)
