from models import Meeting
from flask import Blueprint, request, jsonify
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import time
import os
# from openai import OpenAI
from datetime import datetime
from groq import Groq


meeting_bp = Blueprint("meeting", __name__)


# Configuration
ASSEMBLY_AI_KEY = os.getenv("API_KEY")
OPENAI_CLIENT = Groq(
    
    api_key=os.getenv("OPENAI_API_KEY"))

def format_dialogue(utterances):
    """Turns AssemblyAI utterances into a clean dialogue format."""
    return "\n".join([f"Speaker {u['speaker']}: {u['text']}" for u in utterances])

def generate_summary(transcript_text):
    """Uses GPT-4 to generate a high-level executive summary."""
    system_prompt = """
    You are a world-class Executive Assistant. Your task is to transform a meeting transcript into a concise, professional summary.
    
    Structure your response using these exact Markdown headers:
    # 🎯 Executive Summary
    (A 2-3 sentence high-level overview of the meeting's purpose and outcome)

    # ✅ Key Decisions
    (Bullet points of what was finalized or agreed upon)

    # 📋 Action Items
    (List specific tasks, who they are assigned to, and deadlines if mentioned. Use the format: **[Owner]**: Task)

    # 💡 Important Discussion Points
    (Key arguments or ideas shared during the meeting)

    Rules: 
    - Be concise.





    - If a speaker's name isn't known, refer to them as 'Speaker A/B'.
    - Ignore filler words (um, uh, like).
    """
    
    response = OPENAI_CLIENT.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"TRANSCRIPT:\n{transcript_text}"}
        ],
        temperature=0.3 # Low temperature for high accuracy
    )
    return response.choices[0].message.content

@meeting_bp.route("/add_meeting", methods=["POST"])
@jwt_required(optional=True)
def add_meeting():
    print("Processing meeting audio...")
    try:
        data = request.get_json()
        if not data or not data.get("audio_url"):
            return jsonify({"error": "Audio URL is required"}), 400

        audio_url = data.get("audio_url")
        title = data.get("title", "Untitled Meeting")
        duration = data.get("duration", "")
        user_id = str(get_jwt_identity())

        #  Start AssemblyAI Transcription
        headers = {"Authorization": f"Bearer {ASSEMBLY_AI_KEY}"}
        assembly_payload = {
            "audio_url": audio_url,
            "speaker_labels": True,
            "speech_models": ["universal-3-pro", "universal-2"],
            "punctuate": True,
            "format_text": True,
            "filter_profanity": False,    # Set to True if you want to censor the transcript
            "language_detection": True 
        }

        response = requests.post(
            "https://api.assemblyai.com/v2/transcript", 
            json=assembly_payload, 
            headers=headers
        )
        
        # CHECk if the initial request actually work?
        res_data = response.json()
        if response.status_code != 200:
            print(f"AssemblyAI Post Error: {res_data}")
            return jsonify({"error": res_data.get("error", "Failed to start transcription")}), response.status_code

        transcript_id = res_data.get('id')

        #  Polling for Completion
        polling_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
        transcript_text = ""
        
        print(f"Polling started for ID: {transcript_id}")

        while True:
            polling_response = requests.get(polling_url, headers=headers)
            result = polling_response.json()

            # CHECK: Does 'status' exist in the response?
            status = result.get('status') 
            
            if status == 'completed':
                # Captures dialogue with speaker labels
                utterances = result.get('utterances')
                if utterances:
                    transcript_text = format_dialogue(utterances)
                else:
                    transcript_text = result.get('text', '')
                break
                
            elif status == 'error':
                error_msg = result.get('error', 'Unknown AssemblyAI error')
                print(f"AssemblyAI Polling Error: {error_msg}")
                return jsonify({"error": f"Transcription failed: {error_msg}"}), 500
            
            elif status is None:
                
                print(f"Unexpected API Response: {result}")
                return jsonify({"error": "Unexpected response from transcription service"}), 500

            print(f"Current Status: {status}...")
            time.sleep(3)

        # Generate Summary
        print("Generating AI summary...")
        summary = generate_summary(transcript_text)

        # Save to Database
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

        return jsonify({
            "message": "Meeting processed successfully",
            "meeting_id": new_meeting.id
        }), 201

    except Exception as e:
        print(f"Caught Exception: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500
   

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
    