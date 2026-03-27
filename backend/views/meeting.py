from models import Meeting
from flask import Blueprint, request, jsonify
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import time
import os
from openai import OpenAI
from datetime import datetime


meeting_bp = Blueprint("meeting", __name__)


API_KEY = os.getenv("API_KEY")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@meeting_bp.route("/add_meeting", methods=["POST"])
@jwt_required(optional=True)
def add_meeting():
    print("Received request to add meeting")
    try:
        # get meeting data from the frontend ie title created_at,duration, audio_url
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        title = data.get("title")
        if not title:
            return jsonify({"error": "Title is required"}), 400

        duration = data.get("duration")
        audio_url = data.get("audio_url")
        if not audio_url:
            return jsonify({"error": "Audio URL is required"}), 400

        user_id = str(get_jwt_identity())

        # we take the audio url and call the external endpoint to get the transcription

        base_url = "https://api.assemblyai.com"

        headers = {
            "Authorization": f"Bearer {API_KEY}"
        }
        # You can upload a local file using the following code
        # with open("./my-audio.mp3", "rb") as f:
        #   response = requests.post(base_url + "/v2/upload",
        #                           headers=headers,
        #                           data=f)
        #
        # audio_url = response.json()["upload_url"]

        data = {
            "audio_url": audio_url,
            "language_detection": True,
            # Uses universal-3-pro for en, es, de, fr, it, pt. Else uses universal-2 for support across all other languages
            "speech_models": ["universal-2"]
        }

        url = base_url + "/v2/transcript"
        response = requests.post(url, json=data, headers=headers)

        transcript_id = response.json()['id']

        if not transcript_id:
            return jsonify({"error": "Failed to start transcription"}), 400

        polling_endpoint = base_url + "/v2/transcript/" + transcript_id
        transcript_text = ""

        while True:
            transcription_result = requests.get(
                polling_endpoint, headers=headers).json()
            if transcription_result['status'] == 'completed':
                transcript_text = transcription_result.get('text', '')
                if not transcript_text:
                    return jsonify({"error": "Transcription completed but no text found"}), 400
                print(f"Transcript Text: {transcript_text}")
                break

            elif transcription_result['status'] == 'error':
                raise RuntimeError(
                    f"Transcription failed: {transcription_result['error']}")

            else:
                time.sleep(3)

        response = client.chat.completions.create(
            model="gpt-4",  # or "gpt-3.5-turbo" - gpt-5.2 doesn't exist
            messages=[
                {"role": "system", "content": "Summarize this meeting into clear bullet points with key decisions and action items."},
                {"role": "user", "content": transcript_text}
            ]
        )
        summary = response.choices[0].message.content
        # we save both the summary and the transcription to the db

        title = str(title) if title else ""
        duration = str(duration) if duration else ""
        audio_url = str(audio_url)
        summary = str(summary) if summary else ""
        transcript_text = str(transcript_text)

        new_meeting = Meeting(
            title=title,
            duration=duration,
            audio_url=audio_url,
            summary=summary,
            transcript=transcript_text,

            user_id=user_id
        )
        db.session.add(new_meeting)
        db.session.commit()

        return jsonify({"message": "Meeting added successfully", "meeting_id": new_meeting.id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
        # we take the transcription and send it to ai to get the summary

@meeting_bp.route("/get_meetings", methods=["GET"])
@jwt_required()
def get_meetings():
    user_id=get_jwt_identity()
    meetings=Meeting.query.filter_by(user_id=user_id).all()
    meetings_list= [
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
    } for meeting in meetings
    ]

    return jsonify({"meetings":meetings_list}),200


# update meeting details
@meeting_bp.route("/update_meeting/<int:meeting_id>", methods=["PUT"])
@jwt_required()
def update_meeting(meeting_id):
    # receive the data from the frontend
    data=request.get_json()

    title =data.get("title")
    scheduled_time = data.get("scheduled_time")
    status = data.get("status")
    folder_id = data.get("folder_id")
   

    meeting= Meeting.query.filter_by(id=meeting_id).first()
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404
    
    meeting.title=title or meeting.title 
    
    meeting.status = status or meeting.status
    meeting.folder_id = folder_id or meeting.folder_id

    if scheduled_time:
        meeting.scheduled_time = datetime.fromisoformat(scheduled_time)

    db.session.commit()

    return jsonify({"message": "Meeting updated successfully"}), 200





# delete meeting
@meeting_bp.route("/delete_meeting/<int:meeting_id>", methods=["DELETE"])
@jwt_required()
def delete_meeting(meeting_id):
    meeting= Meeting.query.filter_by(id=meeting_id).first()
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404
    
    db.session.delete(meeting)
    db.session.commit()

    return jsonify({"message": "Meeting deleted successfully"}), 200
    