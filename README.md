# Resume Tracker

A web application for managing job applications and resumes, with AWS S3 integration for secure file storage.

## Project Setup

### Prerequisites
- Python 3.8+
- AWS Account with S3 access
- AWS credentials (Access Key ID and Secret Access Key)

### AWS Setup
1. Create an S3 bucket for storing resumes
2. Create an IAM user with S3 access
3. Configure bucket permissions and CORS settings
4. Set up environment variables (see `.env.example`)

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/resume-tracker.git
cd resume-tracker
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your AWS credentials
```

5. Run the application:
```bash
python app.py
```

## AWS Configuration
The application uses AWS S3 for secure file storage. To set up:

1. Create an S3 bucket
2. Configure bucket permissions:
   - Enable public access
   - Set up CORS configuration
   - Create bucket policy

3. Create IAM user with S3 access:
   - Programmatic access only
   - Attach S3 permissions
   - Save access keys securely

## Security Notes
- Never commit AWS credentials to version control
- Use environment variables for sensitive information
- Regularly rotate access keys
- Follow AWS security best practices

## License
MIT License 