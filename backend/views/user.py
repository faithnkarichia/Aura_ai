from flask import Blueprint, request, jsonify
from models import User
from extensions import bcrypt, db
from flask_jwt_extended import create_access_token

user_bp= Blueprint("user", __name__)

@user_bp.route("/register", methods=["POST"])
def register():
    # get data from the frontend
    # validate data
    # check if the user exists if not create a new user and send it the the database

    data=request.get_json()
    name= data.get("name")
    email= data.get("email")
    password= data.get("password")
    if not name :
        return jsonify({"error": "Name is required"}), 400

    if not email:
        return jsonify({"error": "Email is required"}), 400

    if not password:
        return jsonify({"error": "Password is required"}), 400

    hashed_password= bcrypt.generate_password_hash(password).decode("utf-8")

        # to check the user if they exist we query the db to check if the email exists

    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({"error": "User with this email already exists"}),400

    new_user = User(name=name, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()



@user_bp.route("/login", methods=["POST"])
def login():
    # get data from the frontend
    data= request.get_json()
    email= data.get("email")
    password= data.get("password")
    # validate data
    if not email:
        return jsonify({"error": "Email is required "}),400
    
    # check if the user exists if not send an error message

    user= User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401


    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Invalid password"}), 400
    # if the user exists create a jwt token and send it to the frontend
    
    print("user logged in successfully")
    print("creating jwt token")

    access_token= create_access_token({"name": user.name, "email": user.email})

    return jsonify({"access_token":access_token }),200
