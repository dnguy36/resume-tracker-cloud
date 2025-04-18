from flask import Blueprint, jsonify, request, redirect, session
from flask_login import login_required, current_user
from app.services.gmail_service import GmailService
from datetime import datetime
from pymongo import MongoClient
import os
import json

gmail_bp = Blueprint('gmail', __name__)
gmail_service = GmailService()

# Initialize MongoDB client
client = MongoClient(os.getenv('MONGODB_URI'))
db = client[os.getenv('MONGODB_DB', 'resume_tracker')]

@gmail_bp.route('/auth/gmail', methods=['GET'])
@login_required
def gmail_auth():
    """Start Gmail OAuth2 flow."""
    auth_url = gmail_service.get_auth_url()
    return jsonify({'auth_url': auth_url})

@gmail_bp.route('/auth/gmail/callback', methods=['GET'])
@login_required
def gmail_callback():
    """Handle Gmail OAuth2 callback."""
    auth_code = request.args.get('code')
    if not auth_code:
        return jsonify({'error': 'Authorization code not provided'}), 400

    try:
        credentials = gmail_service.get_credentials(auth_code)
        
        # Store credentials in user's session
        session['gmail_credentials'] = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        return jsonify({'success': True, 'message': 'Gmail authentication successful'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@gmail_bp.route('/gmail/sync', methods=['POST'])
@login_required
def sync_gmail():
    """Sync job applications from Gmail."""
    if 'gmail_credentials' not in session:
        return jsonify({'error': 'Gmail not authenticated'}), 401

    try:
        # Restore credentials from session
        credentials = gmail_service.refresh_credentials(session['gmail_credentials'])
        gmail_service.initialize_service(credentials)

        # Fetch and parse emails
        applications = gmail_service.fetch_job_application_emails()
        
        # Save applications to MongoDB
        new_applications = []
        for app_data in applications:
            # Check if application already exists
            existing = db.applications.find_one({
                'user_id': str(current_user.id),
                'company': app_data['company'],
                'position': app_data['position'],
                'application_date': app_data['application_date']
            })

            if not existing:
                application = {
                    'user_id': str(current_user.id),
                    'company': app_data['company'],
                    'position': app_data['position'],
                    'status': app_data['status'],
                    'application_date': app_data['application_date'],
                    'source': 'gmail',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                db.applications.insert_one(application)
                new_applications.append(app_data)

        return jsonify({
            'message': f'Successfully synced {len(new_applications)} new applications',
            'applications': new_applications
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@gmail_bp.route('/gmail/status', methods=['GET'])
@login_required
def gmail_status():
    """Check Gmail authentication status."""
    is_authenticated = 'gmail_credentials' in session
    return jsonify({'is_authenticated': is_authenticated}) 