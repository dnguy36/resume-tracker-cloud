from flask import Flask, request, jsonify, session, redirect
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import boto3
import os
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
from botocore.config import Config
from flask_cors import CORS
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from flask_session import Session
import json
import base64
import re
from email.utils import parsedate_to_datetime

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_TYPE'] = 'filesystem'

# Initialize Flask-Session
Session(app)

# Initialize MongoDB
try:
    mongo_uri = os.getenv('MONGO_URI', 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/resume_tracker?retryWrites=true&w=majority')
    print(f"Connecting to MongoDB at: {mongo_uri}")
    client = MongoClient(
        mongo_uri,
        maxPoolSize=50,
        waitQueueTimeoutMS=2500,
        connectTimeoutMS=2000,
        serverSelectionTimeoutMS=2000
    )
    # Test the connection
    client.admin.command('ping')
    print("Successfully connected to MongoDB")
    db = client.resume_tracker
except Exception as e:
    print(f"MongoDB connection error: {str(e)}")
    raise

# Initialize extensions
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# AWS S3 Configuration
s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION'),
    config=Config(
        connect_timeout=5,
        read_timeout=5,
        retries={'max_attempts': 2}
    )
)
BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

# Gmail OAuth2 routes
@app.route('/api/auth/gmail', methods=['GET'])
@login_required
def gmail_auth():
    """Start Gmail OAuth2 flow."""
    # Load client secrets
    client_secrets_file = os.getenv('GOOGLE_CLIENT_SECRET_FILE')
    if not os.path.exists(client_secrets_file):
        return jsonify({'error': 'Client secrets file not found'}), 500

    flow = Flow.from_client_secrets_file(
        client_secrets_file,
        scopes=['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
        redirect_uri=os.getenv('GOOGLE_OAUTH_REDIRECT_URI')
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    
    return jsonify({'auth_url': authorization_url})

@app.route('/api/auth/gmail/callback', methods=['GET'])
@login_required
def gmail_callback():
    """Handle Gmail OAuth2 callback."""
    auth_code = request.args.get('code')
    if not auth_code:
        return jsonify({'error': 'Authorization code not provided'}), 400

    try:
        flow = Flow.from_client_secrets_file(
            os.getenv('GOOGLE_CLIENT_SECRET_FILE'),
            scopes=['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
            redirect_uri=os.getenv('GOOGLE_OAUTH_REDIRECT_URI')
        )
        
        flow.fetch_token(code=auth_code)
        credentials = flow.credentials
        
        # Store credentials in user's session
        session['gmail_credentials'] = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes
        }
        
        # Redirect back to the frontend dashboard
        return redirect('http://localhost:5173/dashboard')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/gmail/status', methods=['GET'])
@login_required
def gmail_status():
    """Check Gmail authentication status."""
    is_authenticated = 'gmail_credentials' in session
    return jsonify({'is_authenticated': is_authenticated})

@app.route('/api/gmail/disconnect', methods=['POST'])
@login_required
def gmail_disconnect():
    """Disconnect Gmail integration."""
    try:
        # Remove Gmail credentials from session
        if 'gmail_credentials' in session:
            session.pop('gmail_credentials')
        return jsonify({'success': True, 'message': 'Gmail disconnected successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/gmail/sync', methods=['POST'])
@login_required
def sync_gmail():
    """Sync job applications from Gmail."""
    if 'gmail_credentials' not in session:
        return jsonify({'error': 'Gmail not authenticated'}), 401

    try:
        # Initialize Gmail service
        gmail_service = GmailService()
        gmail_service.initialize_service(session['gmail_credentials'])

        # Fetch and parse emails
        applications = gmail_service.fetch_job_application_emails()
        
        # Save new applications to MongoDB
        new_applications = []
        for app_data in applications:
            # Check if application already exists
            existing = db.applications.find_one({
                'user_id': ObjectId(current_user.id),
                'company': app_data['company'],
                'position': app_data['position'],
                'email_id': app_data['email_id']  # Use email_id to prevent duplicates
            })

            if not existing:
                application = {
                    'user_id': ObjectId(current_user.id),
                    'company': app_data['company'],
                    'position': app_data['position'],
                    'status': app_data['status'],
                    'application_date': app_data['application_date'],
                    'source': app_data['source'],
                    'email_id': app_data['email_id'],
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                result = db.applications.insert_one(application)
                app_data['id'] = str(result.inserted_id)
                new_applications.append(app_data)

        return jsonify({
            'message': f'Successfully synced {len(new_applications)} new applications',
            'applications': new_applications
        })

    except Exception as e:
        print(f"Error syncing Gmail: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add a root route to verify the server is working
@app.route('/')
def index():
    return jsonify({
        'message': 'Resume Tracker API is running',
        'status': 'ok',
        'version': '1.0.0'
    })

@app.route('/api/check-auth', methods=['GET'])
@login_required
def check_auth():
    return jsonify({
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email
        }
    })

class User(UserMixin):
    def __init__(self, user_data):
        self.user_data = user_data
        self.id = str(user_data['_id'])
        self.username = user_data['username']
        self.email = user_data['email']
        self.password = user_data['password']

    @staticmethod
    def get_by_email(email):
        user_data = db.users.find_one({'email': email})
        if user_data:
            return User(user_data)
        return None

    @staticmethod
    def create(username, email, password):
        hashed_password = generate_password_hash(password)
        user_data = {
            'username': username,
            'email': email,
            'password': hashed_password
        }
        result = db.users.insert_one(user_data)
        user_data['_id'] = result.inserted_id
        return User(user_data)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def get_id(self):
        return str(self.user_data['_id'])

@login_manager.user_loader
def load_user(user_id):
    try:
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if user_data:
            return User(user_data)
    except:
        return None
    return None

# API Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if db.users.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 400
    
    if db.users.find_one({'username': username}):
        return jsonify({'error': 'Username already taken'}), 400
    
    user = User.create(username, email, password)
    login_user(user)
    
    return jsonify({
        'message': 'Registration successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
            
        user = User.get_by_email(email)
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
            
        if not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        login_user(user)
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")  # This will show in the Flask console
        return jsonify({'error': 'An error occurred during login'}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/dashboard', methods=['GET'])
@login_required
def dashboard():
    try:
        # Fetch user's resumes from MongoDB
        resumes = list(db.resumes.find({'user_id': ObjectId(current_user.id)}))
        print(f"Found {len(resumes)} resumes for user {current_user.id}")
        
        # Add S3 URL to each resume
        for resume in resumes:
            try:
                resume['url'] = s3.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': BUCKET_NAME,
                        'Key': resume['s3_key']
                    },
                    ExpiresIn=3600
                )
                resume['id'] = str(resume['_id'])
                # Convert ObjectId to string for JSON serialization
                resume['user_id'] = str(resume['user_id'])
                resume['_id'] = str(resume['_id'])
                # Convert datetime to string
                if 'upload_date' in resume:
                    resume['upload_date'] = resume['upload_date'].isoformat()
            except Exception as e:
                print(f"Error generating URL for resume {resume.get('_id')}: {str(e)}")
                resume['url'] = None
        
        # Fetch user's job applications
        applications = list(db.applications.find({'user_id': ObjectId(current_user.id)}))
        
        # Convert ObjectId to string for JSON serialization
        for app in applications:
            app['id'] = str(app['_id'])
            app['user_id'] = str(app['user_id'])
            app['_id'] = str(app['_id'])
            # Convert datetime to string
            if 'apply_date' in app:
                app['apply_date'] = app['apply_date'].isoformat()
        
        print(f"Found {len(applications)} applications for user {current_user.id}")
        
        return jsonify({
            'resumes': resumes,
            'applications': applications
        })
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({'error': 'Failed to fetch dashboard data'}), 500

@app.route('/api/upload', methods=['POST'])
@login_required
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['resume']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        # Upload to S3
        s3_key = f"resumes/{current_user.id}/{file.filename}"
        s3.upload_fileobj(
            file,
            BUCKET_NAME,
            s3_key
        )
        
        # Save to MongoDB
        resume_data = {
            'filename': file.filename,
            's3_key': s3_key,
            'upload_date': datetime.utcnow(),
            'user_id': ObjectId(current_user.id)
        }
        db.resumes.insert_one(resume_data)
        
        return jsonify({'message': 'Resume uploaded successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resume/<resume_id>', methods=['DELETE'])
@login_required
def delete_resume(resume_id):
    try:
        resume = db.resumes.find_one({
            '_id': ObjectId(resume_id),
            'user_id': ObjectId(current_user.id)
        })
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Delete from S3
        s3.delete_object(
            Bucket=BUCKET_NAME,
            Key=resume['s3_key']
        )
        
        # Delete from MongoDB
        result = db.resumes.delete_one({'_id': ObjectId(resume_id)})
        if result.deleted_count == 1:
            return jsonify({'message': 'Resume deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete from database'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/applications/clear', methods=['POST'])
@login_required
def clear_applications():
    try:
        # Delete all applications for the current user
        result = db.applications.delete_many({'user_id': ObjectId(current_user.id)})
        return jsonify({
            'message': f'Successfully cleared {result.deleted_count} applications',
            'deleted_count': result.deleted_count
        })
    except Exception as e:
        print(f"Error clearing applications: {str(e)}")
        return jsonify({'error': str(e)}), 500

class GmailService:
    def __init__(self):
        self.service = None

    def get_auth_url(self):
        """Get the authorization URL for Gmail OAuth2."""
        flow = Flow.from_client_secrets_file(
            os.getenv('GOOGLE_CLIENT_SECRET_FILE'),
            scopes=['https://www.googleapis.com/auth/gmail.readonly'],
            redirect_uri=os.getenv('GOOGLE_OAUTH_REDIRECT_URI')
        )
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        return authorization_url

    def get_credentials(self, auth_code):
        """Get credentials from authorization code."""
        flow = Flow.from_client_secrets_file(
            os.getenv('GOOGLE_CLIENT_SECRET_FILE'),
            scopes=['https://www.googleapis.com/auth/gmail.readonly'],
            redirect_uri=os.getenv('GOOGLE_OAUTH_REDIRECT_URI')
        )
        flow.fetch_token(code=auth_code)
        return flow.credentials

    def initialize_service(self, credentials_dict):
        """Initialize Gmail service with credentials."""
        credentials = Credentials(
            token=credentials_dict['token'],
            refresh_token=credentials_dict['refresh_token'],
            token_uri=credentials_dict['token_uri'],
            client_id=credentials_dict['client_id'],
            client_secret=credentials_dict['client_secret'],
            scopes=credentials_dict['scopes']
        )
        self.service = build('gmail', 'v1', credentials=credentials)

    def _extract_company_name(self, subject, body, from_header):
        """Extract company name from email subject, body, and from header."""
        # First try to extract from the From header as it's usually most reliable
        from_name = self._extract_company_from_email(from_header)
        if from_name and len(from_name) > 2:  # Ensure it's not just a short abbreviation
            return from_name

        # Common patterns for company names in application emails
        patterns = [
            r"(?:application|applied) (?:at|to|with) ([A-Za-z0-9][A-Za-z0-9\s&.-]{2,40}?)(?:[\.,]|\s+(?:for|position|team|careers|jobs))",
            r"thank you for (?:your interest|applying) (?:at|to|with) ([A-Za-z0-9][A-Za-z0-9\s&.-]{2,40}?)(?:[\.,]|\s+(?:for|position|team))",
            r"welcome to ([A-Za-z0-9][A-Za-z0-9\s&.-]{2,40}?)(?:[\.,]|\s+(?:careers|team))",
            r"from ([A-Za-z0-9][A-Za-z0-9\s&.-]{2,40}?) (?:team|recruiting|careers|hiring)",
            r"([A-Za-z0-9][A-Za-z0-9\s&.-]{2,40}?) (?:team|careers) would like",
            r"([A-Za-z0-9][A-Za-z0-9\s&.-]{2,40}?) application (?:portal|status|received)"
        ]

        # Try subject first as it's usually more structured
        for pattern in patterns:
            match = re.search(pattern, subject, re.IGNORECASE)
            if match:
                company = match.group(1).strip()
                if self._is_valid_company_name(company):
                    return company

        # Then try body
        for pattern in patterns:
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                company = match.group(1).strip()
                if self._is_valid_company_name(company):
                    return company

        return None

    def _is_valid_company_name(self, name):
        """Validate extracted company name."""
        if not name:
            return False
            
        # List of common words that shouldn't be company names
        invalid_names = {
            'team', 'career', 'careers', 'job', 'jobs', 'position', 'application',
            'portal', 'status', 'update', 'mail', 'email', 'notification', 'alert',
            'center', 'global', 'local', 'international', 'worldwide', 'recruiting',
            'talent', 'hr', 'human resources', 'apply', 'applied', 'applying'
        }
        
        # Check if the name is just a common word
        if name.lower() in invalid_names:
            return False
            
        # Check length and character requirements
        if len(name) < 2 or len(name) > 40:
            return False
            
        # Must contain at least one letter
        if not any(c.isalpha() for c in name):
            return False
            
        return True

    def _extract_position(self, subject, body):
        """Extract position from email subject and body."""
        # Common patterns for job positions
        patterns = [
            r"(?:position|role|job)(?: for)?:?\s*([A-Za-z0-9][A-Za-z0-9\s\-&.]{2,50}?)(?:[\.,]|\s+(?:at|with|position|role|job|team))",
            r"applying for(?: the)? ([A-Za-z0-9][A-Za-z0-9\s\-&.]{2,50}?)(?:[\.,]|\s+(?:at|with|position|role|job|team))",
            r"application for(?: the)? ([A-Za-z0-9][A-Za-z0-9\s\-&.]{2,50}?)(?:[\.,]|\s+(?:at|with|position|role|job|team))",
            r"interested in(?: the)? ([A-Za-z0-9][A-Za-z0-9\s\-&.]{2,50}?)(?:[\.,]|\s+(?:at|with|position|role|job|team))",
            r"regarding the ([A-Za-z0-9][A-Za-z0-9\s\-&.]{2,50}?)(?:[\.,]|\s+(?:at|with|position|role|job|team))"
        ]

        # Try subject first
        for pattern in patterns:
            match = re.search(pattern, subject, re.IGNORECASE)
            if match:
                position = match.group(1).strip()
                if self._is_valid_position(position):
                    return position

        # Then try body
        for pattern in patterns:
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                position = match.group(1).strip()
                if self._is_valid_position(position):
                    return position

        return None

    def _is_valid_position(self, position):
        """Validate extracted position."""
        if not position:
            return False
            
        # List of common words that shouldn't be positions by themselves
        invalid_positions = {
            'job', 'position', 'role', 'opportunity', 'application', 'career',
            'team', 'work', 'employment', 'opening', 'vacancy', 'apply', 'applied',
            'new', 'current', 'future', 'available'
        }
        
        # Check if the position is just a common word
        if position.lower() in invalid_positions:
            return False
            
        # Check length requirements
        if len(position) < 3 or len(position) > 50:
            return False
            
        # Must contain at least one letter
        if not any(c.isalpha() for c in position):
            return False
            
        return True

    def fetch_job_application_emails(self, max_results=100):
        """Fetch and parse job application confirmation emails."""
        if not self.service:
            raise Exception("Gmail service not initialized")

        # Case-insensitive search query using Gmail's {} syntax
        query = """
        (
            subject:{application received} OR
            subject:{application confirmation} OR
            subject:{thank you for applying} OR
            subject:{application submitted} OR
            subject:{we received your application} OR
            subject:{we have received your application} OR
            subject:{your application has been received} OR
            subject:{your application has been submitted}
        )
        """
        
        try:
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()

            messages = results.get('messages', [])
            if not messages:
                print("No messages found matching the query")
                return []

            print(f"Found {len(messages)} potential job application emails")
            applications = []

            for message in messages:
                try:
                    msg = self.service.users().messages().get(
                        userId='me',
                        id=message['id'],
                        format='full'
                    ).execute()

                    # Extract email data
                    headers = msg['payload']['headers']
                    subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '')
                    date_str = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')
                    from_header = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
                    
                    # Get email body
                    body = self._get_email_body(msg['payload'])

                    # Extract company name and position
                    company_name = self._extract_company_name(subject, body, from_header)
                    position = self._extract_position(subject, body)

                    if company_name:  # Only add if we found a company name
                        # Determine application status
                        status = 'Rejected' if any(phrase in body.lower() for phrase in [
                            'regret to inform',
                            'not moving forward',
                            'not be pursuing',
                            'not selected',
                            'decided to proceed with other candidates',
                            'unfortunately'
                        ]) else 'Applied'

                        applications.append({
                            'company': company_name,
                            'position': position or 'Position Not Found',
                            'application_date': parsedate_to_datetime(date_str).isoformat(),
                            'status': status,
                            'source': 'Gmail',
                            'email_id': message['id']
                        })

                except Exception as e:
                    print(f"Error processing message {message['id']}: {str(e)}")
                    continue

            return applications

        except Exception as e:
            print(f"Error fetching emails: {str(e)}")
            raise

    def _get_email_body(self, payload):
        """Extract email body from payload."""
        if 'body' in payload and payload['body'].get('data'):
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain' and part['body'].get('data'):
                    return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                elif part['mimeType'] == 'text/html' and part['body'].get('data'):
                    return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
        
        return ""

    def _extract_company_from_email(self, from_header):
        """Extract company name from email address."""
        # Try to extract company name from email domain
        email_match = re.search(r'@([^.]+)', from_header.lower())
        if email_match:
            domain = email_match.group(1)
            # Exclude common email providers
            common_domains = {'gmail', 'yahoo', 'hotmail', 'outlook', 'aol', 'icloud'}
            if domain not in common_domains:
                return domain.title()
        return None

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 