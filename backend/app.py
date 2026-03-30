from flask import Flask
from extensions import db,jwt
import os
from dotenv import load_dotenv, find_dotenv
from datetime import timedelta
from flask_migrate import Migrate
from openai import OpenAI
from flask_cors import CORS



from models import User, Meeting, Folder


load_dotenv()


app= Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

app.config["SQLALCHEMY_DATABASE_URI"]= "sqlite:///voicenote_ai.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"]= False
app.config["JWT_SECRET_KEY"]= os.getenv("JWT_SECRET_KEY")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=3)


db.init_app(app)
migrate=Migrate(app,db)
jwt.init_app(app)

from views.user import user_bp
from views.meeting import meeting_bp
from views.folders import folder_bp

app.register_blueprint(folder_bp)
app.register_blueprint(user_bp)
app.register_blueprint(meeting_bp)


@app.route("/")
def home():
    return "Welcome to the VoiceNote AI API!"


if __name__ == "__main__":
    app.run(debug=True)