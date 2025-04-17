import pytest
from app import app, db, User, Resume, Application
from werkzeug.security import generate_password_hash

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Create test user
            test_user = User(
                email='test@example.com',
                password_hash=generate_password_hash('testpassword')
            )
            db.session.add(test_user)
            db.session.commit()
        yield client
        with app.app_context():
            db.drop_all()

def test_index_page(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Welcome to Resume Tracker' in response.data

def test_login_page(client):
    response = client.get('/login')
    assert response.status_code == 200
    assert b'Login' in response.data

def test_register_page(client):
    response = client.get('/register')
    assert response.status_code == 200
    assert b'Create Account' in response.data

def test_user_registration(client):
    response = client.post('/register', data={
        'email': 'newuser@example.com',
        'password': 'newpassword',
        'confirm_password': 'newpassword'
    }, follow_redirects=True)
    assert response.status_code == 200
    
    with app.app_context():
        user = User.query.filter_by(email='newuser@example.com').first()
        assert user is not None

def test_user_login(client):
    response = client.post('/login', data={
        'email': 'test@example.com',
        'password': 'testpassword'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Dashboard' in response.data

def test_protected_routes(client):
    # Test accessing protected route without login
    response = client.get('/dashboard', follow_redirects=True)
    assert b'Login' in response.data
    
    # Login first
    client.post('/login', data={
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    
    # Test accessing protected route after login
    response = client.get('/dashboard')
    assert response.status_code == 200
    assert b'Your Applications' in response.data

def test_resume_upload(client):
    # Login first
    client.post('/login', data={
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    
    # Test resume upload page
    response = client.get('/upload')
    assert response.status_code == 200
    assert b'Upload Resume' in response.data

def test_application_creation(client):
    # Login first
    client.post('/login', data={
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    
    # Create a test resume first
    with app.app_context():
        resume = Resume(
            filename='test.pdf',
            s3_key='test/test.pdf',
            user_id=1
        )
        db.session.add(resume)
        db.session.commit()
    
    # Test new application page
    response = client.get('/application/new')
    assert response.status_code == 200
    assert b'New Job Application' in response.data
    
    # Test creating a new application
    response = client.post('/application/new', data={
        'company': 'Test Company',
        'position': 'Test Position',
        'status': 'applied',
        'resume_id': '1',
        'notes': 'Test notes'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b'Application added successfully' in response.data 