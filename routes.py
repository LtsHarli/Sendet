from flask import render_template, request, jsonify
from models import Message
import base64
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
        
        encrypted_content = encrypt_message(content)
        new_message = Message(session_code=session_code, content=encrypted_content)
        db.session.add(new_message)
        db.session.commit()
        
        return jsonify({'message': 'Message sent successfully', 'content': encrypted_content}), 201

    @app.route('/api/get_messages/<session_code>', methods=['GET'])
    def get_messages(session_code):
        messages = Message.query.filter_by(session_code=session_code).order_by(Message.timestamp).all()
        return jsonify([{'id': m.id, 'content': m.content, 'timestamp': m.timestamp} for m in messages]), 200