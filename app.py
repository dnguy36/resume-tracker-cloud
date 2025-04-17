from flask import Flask, render_template, request, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import boto3
import os
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
from botocore.config import Config

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Initialize MongoDB
mongo_uri = os.getenv('MONGO_URI', 'mongodb://mongodb:27017/')
client = MongoClient(
    mongo_uri,
    maxPoolSize=50,
    waitQueueTimeoutMS=2500,
    connectTimeoutMS=2000,
    serverSelectionTimeoutMS=2000
)
db = client.resume_tracker

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

class User(UserMixin):
    def __init__(self, user_data):
        self.user_data = user_data
        self.id = str(user_data['_id'])  # Convert ObjectId to string
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
        return str(self.user_data['_id'])  # Convert ObjectId to string for Flask-Login

@login_manager.user_loader
def load_user(user_id):
    try:
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        if user_data:
            return User(user_data)
    except:
        return None
    return None

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if db.users.find_one({'email': email}):
            flash('Email already registered')
            return redirect(url_for('register'))
        
        if db.users.find_one({'username': username}):
            flash('Username already taken')
            return redirect(url_for('register'))
        
        user = User.create(username, email, password)
        login_user(user)
        
        flash('Registration successful!')
        return redirect(url_for('dashboard'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.get_by_email(email)
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        
        flash('Invalid email or password')
        return redirect(url_for('login'))
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Fetch user's resumes from MongoDB
    resumes = list(db.resumes.find({'user_id': ObjectId(current_user.id)}))
    
    # Add S3 URL to each resume and convert ObjectId to string
    for resume in resumes:
        resume['url'] = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': resume['s3_key']
            },
            ExpiresIn=3600  # URL expires in 1 hour
        )
        # Convert ObjectId to string for use in template
        resume['id'] = str(resume['_id'])
    
    # Fetch user's job applications
    applications = list(db.applications.find({'user_id': ObjectId(current_user.id)}))
    
    return render_template('dashboard.html', resumes=resumes, applications=applications)

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload_resume():
    if request.method == 'POST':
        if 'resume' not in request.files:
            flash('No file selected')
            return redirect(request.url)
        
        file = request.files['resume']
        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)
        
        if file:
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
                
                flash('Resume uploaded successfully!')
                return redirect(url_for('dashboard'))
            except Exception as e:
                flash(f'Error uploading resume: {str(e)}')
                return redirect(request.url)
    
    return render_template('upload.html')

@app.route('/resume/<resume_id>', methods=['DELETE'])
@login_required
def delete_resume(resume_id):
    try:
        # Print debug info
        print(f"Attempting to delete resume with ID: {resume_id}")
        
        # Get the resume from MongoDB
        resume = db.resumes.find_one({
            '_id': ObjectId(resume_id),
            'user_id': ObjectId(current_user.id)
        })
        
        if not resume:
            print(f"Resume not found with ID: {resume_id}")
            return {'error': 'Resume not found'}, 404
        
        print(f"Found resume: {resume.get('filename')}")
        
        try:
            # Delete from S3
            s3.delete_object(
                Bucket=BUCKET_NAME,
                Key=resume['s3_key']
            )
            print(f"Deleted from S3: {resume['s3_key']}")
        except Exception as s3_error:
            print(f"Error deleting from S3: {str(s3_error)}")
            return {'error': f"S3 error: {str(s3_error)}"}, 500
        
        # Delete from MongoDB
        result = db.resumes.delete_one({'_id': ObjectId(resume_id)})
        if result.deleted_count == 1:
            print(f"Successfully deleted resume from MongoDB")
            return {'message': 'Resume deleted successfully'}, 200
        else:
            print(f"Failed to delete from MongoDB")
            return {'error': 'Failed to delete from database'}, 500
            
    except Exception as e:
        print(f"Unexpected error in delete_resume: {str(e)}")
        return {'error': str(e)}, 500

@app.route('/resume/delete/<resume_id>', methods=['POST'])
@login_required
def delete_resume_form(resume_id):
    try:
        # Print debug info
        print(f"Form-based delete for resume with ID: {resume_id}")
        
        # Get the resume from MongoDB
        resume = db.resumes.find_one({
            '_id': ObjectId(resume_id),
            'user_id': ObjectId(current_user.id)
        })
        
        if not resume:
            flash('Resume not found', 'danger')
            return redirect(url_for('dashboard'))
        
        # Delete from S3
        try:
            s3.delete_object(
                Bucket=BUCKET_NAME,
                Key=resume['s3_key']
            )
            print(f"Deleted from S3: {resume['s3_key']}")
        except Exception as s3_error:
            print(f"Error deleting from S3: {str(s3_error)}")
            flash(f"Error deleting from S3: {str(s3_error)}", 'danger')
            return redirect(url_for('dashboard'))
        
        # Delete from MongoDB
        result = db.resumes.delete_one({'_id': ObjectId(resume_id)})
        if result.deleted_count == 1:
            flash('Resume deleted successfully', 'success')
        else:
            flash('Failed to delete resume from database', 'danger')
            
        return redirect(url_for('dashboard'))
    except Exception as e:
        print(f"Unexpected error in delete_resume_form: {str(e)}")
        flash(f"Error: {str(e)}", 'danger')
        return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 