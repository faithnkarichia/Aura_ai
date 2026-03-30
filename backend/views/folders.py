# add folder
# edit folder
# get folders
# delete folder


from flask import request, Blueprint, jsonify
from models import Folder
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

folder_bp = Blueprint("folder", __name__)


@folder_bp.route("/add_folder", methods=["POST"])
@jwt_required()
def add_folder():

    # get the uder id
    user_id = get_jwt_identity()

    # get the user data
    data = request.get_json()
    name = data.get("name")

    if not name:
        return jsonify({"error": "Folder name is required"}), 400

    # create a new folder
    new_folder = Folder(name=name, user_id=user_id)
    # add to the db
    db.session.add(new_folder)
    db.session.commit()

    return jsonify({"message": "Folder created successfully"}), 200


@folder_bp.route("/get_folders", methods=["GET"])
@jwt_required()
def get_folders():

    user_id = get_jwt_identity()

    folders = Folder.query.filter_by(user_id=user_id).all()

    folders_list =[
        {
            "id" : folder.id,
            "name": folder.name,
            "user_id": folder.user_id,
            "meetings":[
                {
                    "id": meeting.id,
                    "title": meeting.title,
                    "created_at": meeting.created_at.isoformat() if meeting.created_at else None,
                    "duration": meeting.duration,
                    "audio_url": meeting.audio_url,
                    "summary": meeting.summary,
                    "transcript": meeting.transcript,
                    "scheduled_time": meeting.scheduled_time.isoformat() if meeting.scheduled_time else None,
                    "status": meeting.status,
                    "user_id": meeting.user_id,
                    "folder_id": meeting.folder_id  
                } for meeting in folder.meetings
            ]

        } for folder in folders
    ]

    return jsonify({"folders": folders_list}),200

@folder_bp.route("/edit_folder/<int:folder_id>", methods=["PUT"])
@jwt_required()
def edit_folder(folder_id):

    user_id= get_jwt_identity()
    data= request.get_json()
    name= data.get("name")
    folder=Folder.query.filter_by(id=folder_id, user_id=user_id).first()

    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    folder.name = name or folder.name
    db.session.commit()

    return jsonify({"message": "Folder updated successfully"}), 200


@folder_bp.route("/delete_folder/<int:folder_id>", methods=["DELETE"])
@jwt_required()
def delete_folder(folder_id):
    user_id= get_jwt_identity()
    folder= Folder.query.filter_by(id=folder_id, user_id=user_id).first()

    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    
    db.session.delete(folder)
    db.session.commit()