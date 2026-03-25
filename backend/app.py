from flask import Flask
from extensions import db

app= Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"]= "sqlite:///voicenote_ai.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"]= False

db.init_app(app)


@app.route("/")
def home():
    return "Welcome to the VoiceNote AI API!"


if __name__ == "__main__":
    app.run(debug=True)