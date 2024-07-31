import datetime
import base64
from flask import render_template, request, jsonify, session
from models import Message
from config import ADMIN_CODE
import hashlib
import random
import string

def generate_session_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def encrypt_message(message):
    return base64.b64encode(message.encode()).decode()

def register_routes(app, db):
    @app.route("/")
    def home_route():
        return render_template("home.html")

    @app.route('/api/create_session', methods=['POST'])
    def create_session():
        session_code = generate_session_code()
        return jsonify({'session_code': session_code}), 201

    @app.route('/api/send_message', methods=['POST'])
    def send_message():
        data = request.json
        session_code = data.get('session_code')
        content = data.get('content')
        
        if not session_code or not content:
            return jsonify({'error': 'Missing session_code or content'}), 400
        
        # Check if message is longer than 1000 words
        if len(content.split()) > 1000:
            return jsonify({'error': 'Message exceeds 1000 words limit'}), 400
        
        encrypted_content = encrypt_message(content)
        new_message = Message(session_code=session_code, content=encrypted_content)
        db.session.add(new_message)
        db.session.commit()
        
        return jsonify({'message': 'Message sent successfully', 'content': encrypted_content}), 201
        data = request.json
        session_code = data.get('session_code')
        content = data.get('content')
        
        if not session_code or not content:
            return jsonify({'error': 'Missing session_code or content'}), 400
        
        # Check if message is longer than 1000 words
        if len(content.split()) > 1000:
            return jsonify({'error': 'Message exceeds 1000 words limit'}), 400
        
        encrypted_content = encrypt_message(content)
        new_message = Message(session_code=session_code, content=encrypted_content)
        db.session.add(new_message)
        db.session.commit()
        
        return jsonify({'message': 'Message sent successfully', 'content': encrypted_content}), 201

    @app.route('/api/get_messages/<session_code>', methods=['GET'])
    def get_messages(session_code):
        messages = Message.query.filter_by(session_code=session_code).order_by(Message.timestamp).all()
        return jsonify([{'id': m.id, 'content': m.content, 'timestamp': m.timestamp} for m in messages]), 200

    @app.route('/api/verify_admin', methods=['POST'])
    def verify_admin():
        data = request.get_json()
        if data.get('admin_code') == app.config['ADMIN_CODE']:
            return jsonify({'message': 'Admin verified'}), 200
        else:
            app.logger.warning(f"Invalid admin code attempt: {data.get('admin_code')}")
            return jsonify({'error': 'Forbidden'}), 403

    @app.route('/api/get_sessions', methods=['GET'])
    def get_sessions():
        sessions = db.session.query(Message.session_code, db.func.count(Message.id).label('message_count')).group_by(Message.session_code).order_by(db.func.count(Message.id).desc()).all()
        return jsonify([{'session_code': s.session_code, 'message_count': s.message_count} for s in sessions]), 200

    @app.route('/api/delete_session/<session_code>', methods=['DELETE'])
    def delete_session(session_code):
        Message.query.filter_by(session_code=session_code).delete()
        db.session.commit()
        return jsonify({'message': 'Session deleted successfully'}), 200

    @app.route('/api/cleanup_sessions', methods=['POST'])
    def cleanup_sessions():
        two_weeks_ago = datetime.datetime.now() - datetime.timedelta(weeks=2)
        old_sessions = Message.query.filter(Message.timestamp < two_weeks_ago).delete()
        db.session.commit()
        return jsonify({'message': 'Old sessions cleaned up successfully'}), 200
