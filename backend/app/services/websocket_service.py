from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import socketio
import uvicorn
import logging
from typing import Dict, Set
import json
from datetime import datetime

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.user import User
from app.models.support import SupportMessage, SupportTicket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.cors_origins_list,
    logger=True,
    engineio_logger=True
)

# Store active admin sessions
active_admins: Dict[str, dict] = {}
# Store user rooms (user_id -> room mapping)
user_rooms: Dict[str, str] = {}

class SupportNamespace:
    """Support chat namespace for Socket.IO"""
    
    @sio.event
    async def connect(sid, environ):
        """Handle client connection"""
        logger.info(f"Client connected: {sid}")
        
        # Get user info from query params
        query_string = environ.get('QUERY_STRING', '')
        user_info = {}
        
        if query_string:
            try:
                # Parse query string
                params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
                token = params.get('token')
                user_type = params.get('type', 'user')
                
                if token:
                    # Validate token and get user info
                    from app.core.security import decode_token
                    user_id = decode_token(token)
                    
                    if user_id:
                        db = SessionLocal()
                        user = db.query(User).filter(User.id == user_id).first()
                        
                        if user:
                            user_info = {
                                'user_id': user.id,
                                'email': user.email,
                                'username': user.username,
                                'type': user_type,
                                'is_admin': user.role == 'admin'
                            }
                            
                            # Store user info with session
                            await sio.save_session(sid, user_info)
                            
                            # Register admin if admin user
                            if user.role == 'admin':
                                active_admins[sid] = user_info
                                logger.info(f"Admin registered: {user.email}")
                            else:
                                # Register regular user
                                user_rooms[str(user.id)] = sid
                                logger.info(f"User registered: {user.email}")
                        
                        db.close()
            except Exception as e:
                logger.error(f"Error validating token: {e}")
        
        # Send connection confirmation
        await sio.emit('connected', {'status': 'connected', 'user': user_info}, room=sid)
        
        # If admin connected, send list of active users
        if user_info.get('is_admin'):
            active_users = []
            for user_id, user_sid in user_rooms.items():
                active_users.append({
                    'user_id': user_id,
                    'room': user_sid
                })
            
            await sio.emit('active_users', {'users': active_users}, room=sid)

    @sio.event
    async def disconnect(sid):
        """Handle client disconnection"""
        logger.info(f"Client disconnected: {sid}")
        
        # Get user info
        session = await sio.get_session(sid)
        if session:
            user_id = session.get('user_id')
            is_admin = session.get('is_admin', False)
            
            if is_admin:
                # Remove from active admins
                if sid in active_admins:
                    del active_admins[sid]
                    logger.info(f"Admin unregistered: {session.get('email')}")
            else:
                # Remove from user rooms
                if str(user_id) in user_rooms:
                    del user_rooms[str(user_id)]
                    logger.info(f"User unregistered: {session.get('email')}")
        
        # Notify other users about disconnection
        await sio.emit('user_disconnected', {'user_id': session.get('user_id')}, skip_sid=sid)

    @sio.event
    async def join_room(sid, data):
        """Join a specific room (for user-admin chat)"""
        room = data.get('room')
        user_id = data.get('user_id')
        
        if room:
            await sio.enter_room(sid, room)
            logger.info(f"Client {sid} joined room: {room}")
            
            # Notify others in the room
            await sio.emit('user_joined', {
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat()
            }, room=room, skip_sid=sid)

    @sio.event
    async def leave_room(sid, data):
        """Leave a room"""
        room = data.get('room')
        
        if room:
            await sio.leave_room(sid, room)
            logger.info(f"Client {sid} left room: {room}")

    @sio.event
    async def send_message(sid, data):
        """Handle incoming chat messages"""
        try:
            # Get user session
            session = await sio.get_session(sid)
            if not session:
                await sio.emit('error', {'message': 'Oturum bulunamadı'}, room=sid)
                return
            
            room = data.get('room')
            content = data.get('content', '')
            message_type = data.get('type', 'text')
            attachments = data.get('attachments', [])
            
            if not room or not content.strip():
                await sio.emit('error', {'message': 'Oda ve içerik gerekli'}, room=sid)
                return
            
            # Save message to database
            db = SessionLocal()
            try:
                # Find ticket for this room
                ticket = db.query(SupportTicket).filter(
                    SupportTicket.user_id == session['user_id']
                ).order_by(SupportTicket.created_at.desc()).first()
                
                if ticket:
                    # Create support message
                    message = SupportMessage(
                        ticket_id=ticket.id,
                        user_id=session['user_id'],
                        content=content,
                        is_admin=session.get('is_admin', False),
                        attachments=attachments if attachments else None
                    )
                    db.add(message)
                    db.commit()
                    
                    message_data = {
                        'id': message.id,
                        'content': content,
                        'user_id': session['user_id'],
                        'username': session['username'],
                        'is_admin': session.get('is_admin', False),
                        'type': message_type,
                        'attachments': attachments,
                        'timestamp': message.created_at.isoformat()
                    }
                    
                    # Broadcast message to room
                    await sio.emit('new_message', message_data, room=room)
                    
                    # Send confirmation to sender
                    await sio.emit('message_sent', {
                        'message_id': message.id,
                        'timestamp': message.created_at.isoformat()
                    }, room=sid)
                    
                    logger.info(f"Message sent from {session['email']} to room {room}")
                else:
                    await sio.emit('error', {'message': 'Destek talebi bulunamadı'}, room=sid)
            
            except Exception as e:
                logger.error(f"Error saving message: {e}")
                await sio.emit('error', {'message': 'Mesaj kaydedilemedi'}, room=sid)
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await sio.emit('error', {'message': 'Mesaj işlenirken hata oluştu'}, room=sid)

    @sio.event
    async def typing_indicator(sid, data):
        """Handle typing indicators"""
        room = data.get('room')
        is_typing = data.get('typing', False)
        
        if room:
            session = await sio.get_session(sid)
            await sio.emit('typing', {
                'user_id': session.get('user_id'),
                'username': session.get('username'),
                'typing': is_typing
            }, room=room, skip_sid=sid)

    @sio.event
    async def request_chat_history(sid, data):
        """Send chat history for a room"""
        room = data.get('room')
        limit = data.get('limit', 50)
        
        if room:
            try:
                db = SessionLocal()
                
                # Get messages for this room (user's tickets)
                session = await sio.get_session(sid)
                user_id = session.get('user_id')
                
                if user_id:
                    messages = db.query(SupportMessage).join(SupportTicket).filter(
                        SupportTicket.user_id == user_id
                    ).order_by(SupportMessage.created_at.desc()).limit(limit).all()
                    
                    message_history = []
                    for msg in reversed(messages):  # Oldest first
                        message_history.append({
                            'id': msg.id,
                            'content': msg.content,
                            'user_id': msg.user_id,
                            'username': msg.user.username,
                            'is_admin': msg.is_admin,
                            'attachments': msg.attachments or [],
                            'timestamp': msg.created_at.isoformat()
                        })
                    
                    await sio.emit('chat_history', {
                        'messages': message_history,
                        'room': room
                    }, room=sid)
                
                db.close()
                
            except Exception as e:
                logger.error(f"Error getting chat history: {e}")
                await sio.emit('error', {'message': 'Mesaj geçmişi alınamadı'}, room=sid)

# Create ASGI app
socket_app = socketio.ASGIApp(sio)

# Export for use in main.py
def get_socket_server():
    return sio