# JobTracker

JobTracker is a modern web application designed to help job seekers manage their job applications, track their progress, and gain insights into their job search journey. The application features Gmail integration for automatic application tracking and AI-powered email parsing.

## Features

- **Smart Application Tracking**: Automatically track job applications from Gmail
- **Resume Management**: Upload and manage multiple resume versions
- **AI-Powered Analysis**: Uses OpenAI to analyze application emails and extract relevant information
- **Dashboard Analytics**: Visual metrics and insights about your job search progress
- **Modern UI**: Clean, responsive design with dark mode support

## Tech Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Framer Motion for animations
- Context API for state management

### Backend
- Flask (Python)
- MongoDB for database
- AWS S3 for resume storage
- OpenAI API for email analysis
- Gmail API for email integration

## Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB
- AWS Account (for S3)
- OpenAI API Key
- Google Cloud Project (for Gmail API)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Flask
SECRET_KEY=your_secret_key
FLASK_ENV=development

# MongoDB
MONGO_URI=your_mongodb_uri

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_bucket_name

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google OAuth
GOOGLE_CLIENT_SECRET_FILE=path_to_client_secret.json
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5173/api/auth/gmail/callback
```

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resume-tracker-cloud.git
   cd resume-tracker-cloud
   ```

2. **Backend Setup**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Start the Flask server
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   # Navigate to frontend directory
   cd frontend-new

   # Install dependencies
   npm install

   # Start the development server
   npm run dev
   ```

4. **Database Setup**
   - Ensure MongoDB is running
   - The application will automatically create necessary collections

5. **AWS S3 Setup**
   - Create an S3 bucket
   - Configure CORS for the bucket
   - Set up appropriate IAM permissions

6. **Google OAuth Setup**
   - Create a project in Google Cloud Console
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Download client secret file
   - Configure authorized redirect URIs

## Usage

1. **Registration/Login**
   - Create a new account or sign in with existing credentials
   - Access the dashboard after authentication

2. **Gmail Integration**
   - Click "Connect Gmail" in the dashboard
   - Authorize the application to access your Gmail
   - The app will automatically track job application emails

3. **Resume Management**
   - Upload resumes through the dashboard
   - View and manage uploaded resumes
   - Download resumes when needed

4. **Application Tracking**
   - View all tracked applications in the dashboard
   - Monitor application status
   - Get insights into your job search progress

## Development

### Project Structure
```
resume-tracker-cloud/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── frontend-new/         # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # Context providers
│   │   ├── assets/       # Static assets
│   │   └── App.jsx       # Main application component
│   └── package.json      # Node.js dependencies
└── README.md             # This file
```

### Running Tests
```bash
# Backend tests
pytest

# Frontend tests
cd frontend-new
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- OpenAI for providing the AI capabilities
- Google for the Gmail API
- AWS for cloud storage services
- The open-source community for various tools and libraries
