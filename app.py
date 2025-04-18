from flask import Flask, request, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import boto3
import os
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
from botocore.config import Config
from flask_cors import CORS

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
    raise  # This will stop the application if MongoDB isn't available

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 