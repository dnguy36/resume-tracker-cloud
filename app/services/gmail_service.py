from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from datetime import datetime
import base64
import re
import os
from typing import List, Dict, Optional
from email.utils import parsedate_to_datetime

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

    def fetch_job_application_emails(self, max_results=100):
        """Fetch and parse job application confirmation emails."""
        if not self.service:
            raise Exception("Gmail service not initialized")

        # Search query for job application confirmation emails
        query = "(subject:'application received' OR subject:'application confirmation' OR subject:'thank you for applying')"
        
        try:
            # Get list of messages matching the query
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()

            messages = results.get('messages', [])
            applications = []

            for message in messages:
                msg = self.service.users().messages().get(
                    userId='me',
                    id=message['id'],
                    format='full'
                ).execute()

                # Extract email data
                headers = msg['payload']['headers']
                subject = next(h['value'] for h in headers if h['name'].lower() == 'subject')
                date_str = next(h['value'] for h in headers if h['name'].lower() == 'date')
                
                # Get email body
                body = self._get_email_body(msg['payload'])

                # Extract company name and position
                company_name = self._extract_company_name(subject, body)
                position = self._extract_position(subject, body)

                if company_name:  # Only add if we found a company name
                    applications.append({
                        'company': company_name,
                        'position': position or 'Position Not Found',
                        'application_date': parsedate_to_datetime(date_str).isoformat(),
                        'status': 'Applied',
                        'source': 'Gmail',
                        'email_id': message['id']
                    })

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

    def _extract_company_name(self, subject, body):
        """Extract company name from email subject and body."""
        # Common patterns for company names in application emails
        patterns = [
            r"thank you for applying to ([A-Za-z0-9\s&]+)",
            r"application (?:received|confirmed) - ([A-Za-z0-9\s&]+)",
            r"([A-Za-z0-9\s&]+) application (?:received|confirmation)",
            r"your application to ([A-Za-z0-9\s&]+)",
            r"from ([A-Za-z0-9\s&]+) recruiting",
            r"([A-Za-z0-9\s&]+) careers"
        ]

        # Try to find company name in subject first
        for pattern in patterns:
            match = re.search(pattern, subject, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        # Then try in body
        for pattern in patterns:
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def _extract_position(self, subject, body):
        """Extract position from email subject and body."""
        # Common patterns for job positions
        patterns = [
            r"position:?\s*([A-Za-z0-9\s]+)",
            r"role:?\s*([A-Za-z0-9\s]+)",
            r"applying for (?:the|our)?\s*([A-Za-z0-9\s]+)\s*(?:position|role|opening)",
            r"your application for (?:the)?\s*([A-Za-z0-9\s]+)\s*(?:position|role)"
        ]

        # Try to find position in subject first
        for pattern in patterns:
            match = re.search(pattern, subject, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        # Then try in body
        for pattern in patterns:
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def parse_job_application_email(self, message: Dict) -> Optional[Dict]:
        """Parse job application email content."""
        if 'payload' not in message:
            return None

        headers = message['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '')
        from_email = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
        date = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')

        # Extract email body
        parts = message['payload'].get('parts', [])
        body = ''
        for part in parts:
            if part.get('mimeType') == 'text/plain':
                data = part.get('body', {}).get('data', '')
                if data:
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
                    break

        # Parse job details using regex patterns
        company_pattern = r"(?i)(?:applied to|application for|position at)\s+([A-Za-z0-9\s&]+)"
        position_pattern = r"(?i)(?:position:|job:|role:)\s+([A-Za-z0-9\s]+)"

        company_match = re.search(company_pattern, subject + ' ' + body)
        position_match = re.search(position_pattern, subject + ' ' + body)

        if not (company_match or position_match):
            return None

        return {
            'company': company_match.group(1).strip() if company_match else 'Unknown Company',
            'position': position_match.group(1).strip() if position_match else 'Unknown Position',
            'application_date': datetime.strptime(date, '%a, %d %b %Y %H:%M:%S %z').strftime('%Y-%m-%d'),
            'status': 'applied',
            'source_email': from_email
        }

    def fetch_job_application_emails(self, query: str = "subject:'job application' OR subject:'applied'") -> List[Dict]:
        """Fetch and parse job application emails."""
        if not self.service:
            raise ValueError("Gmail service not initialized")

        results = self.service.users().messages().list(
            userId='me',
            q=query
        ).execute()

        messages = results.get('messages', [])
        applications = []

        for message in messages:
            msg = self.service.users().messages().get(
                userId='me',
                id=message['id'],
                format='full'
            ).execute()

            application = self.parse_job_application_email(msg)
            if application:
                applications.append(application)

        return applications

    def refresh_credentials(self, credentials: Dict) -> Credentials:
        """Refresh OAuth2 credentials."""
        return Credentials(
            token=credentials.get('token'),
            refresh_token=credentials.get('refresh_token'),
            token_uri=credentials.get('token_uri'),
            client_id=credentials.get('client_id'),
            client_secret=credentials.get('client_secret'),
            scopes=credentials.get('scopes')
        ) 