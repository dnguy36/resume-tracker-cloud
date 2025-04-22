# Dat Nguyen's Portfolio Website

A modern, responsive portfolio website built with Next.js, showcasing my projects and skills as a Computer Science student at George Mason University.

## Features

### Navigation & Header
- Responsive navigation bar with smooth animations
- Social media links (GitHub, LinkedIn, Email)
- Resume download option
- Mobile-friendly menu

### Hero Section
- Animated introduction with rotating tech stack icons
- Interactive orbiting circles showcasing technologies
- Social media quick links

### Projects Section
- Dynamic project cards with hover effects
- Support for both images and videos
- Technology stack tags
- GitHub repository links
- Featured projects:
  - Job Application Tracker (WIP)
  - AI Object Detection
  - Manipulator AI
  - BringTheMenu

### Contact Section
- Contact form with email integration
- Form validation
- Success/error notifications

## Technologies Used

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Shadcn UI (components)

### Backend & Services
- Vercel (deployment)
- Resend (email service)
- MongoDB (database)
- Amazon S3 (storage)
- OpenAI API (AI integration)

## Recent Updates
- Added Job Application Tracker project
- Updated project descriptions and technologies
- Implemented video support for project showcases
- Enhanced UI/UX with animations and transitions
- Added responsive design improvements

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/portfolio.git
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
```
portfolio/
├── public/
│   ├── projects/     # Project images and videos
│   └── videos/       # Video assets
├── src/
│   ├── components/   # React components
│   ├── constants/    # Configuration files
│   ├── lib/         # Utility functions
│   └── app/         # Next.js app directory
└── package.json
```

## Contributing
Feel free to fork this repository and make your own changes. Pull requests are welcome!

## License
This project is open source and available under the MIT License.

# Job Application Tracker

A comprehensive job application tracking system that automatically parses and analyzes job application emails using AI. Built with Next.js, MongoDB, and Amazon S3.

## How It Works

### Email Integration
- Uses OAuth to securely connect to user's email account
- Automatically scans incoming emails for job application-related content
- Extracts key information like company name, position, and application status

### AI-Powered Analysis
- Leverages OpenAI's API to analyze email content
- Extracts structured data from unstructured email text
- Identifies application status (applied, interview, rejected, etc.)
- Categorizes and tags applications automatically

### Data Storage
- MongoDB: Stores structured application data
  - Company information
  - Position details
  - Application status
  - Interview dates
  - Notes and comments
- Amazon S3: Stores resumes and related documents
  - Secure file storage
  - Easy retrieval and management
  - Version control for documents

### User Interface
- Dashboard with application statistics
- Timeline view of application progress
- Filter and search capabilities
- Resume management system
- Status tracking and updates

## Technical Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Shadcn UI (components)

### Backend
- MongoDB (database)
- Amazon S3 (file storage)
- OpenAI API (email analysis)
- OAuth (email integration)

## Features

### Email Processing
- Automatic email scanning
- AI-powered content analysis
- Status detection
- Company information extraction

### Application Management
- Track application status
- Store and manage resumes
- Add notes and comments
- Set reminders and deadlines

### Analytics
- Application success rate
- Interview conversion rate
- Response time tracking
- Company distribution

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/dnguy36/resume-tracker-cloud.git
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```env
MONGODB_URI=your_mongodb_uri
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret
OPENAI_API_KEY=your_openai_key
```

4. Run the development server:
```bash
npm run dev
```

## Project Structure
```
resume-tracker-cloud/
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utility functions
│   ├── api/           # API routes
│   └── app/           # Next.js app directory
├── public/            # Static assets
└── package.json
```

## Current Status
- Core functionality implemented
- Email integration working
- AI analysis operational
- UI/UX improvements in progress

## Future Enhancements
- Enhanced analytics dashboard
- Interview scheduling integration
- Automated follow-up emails
- Mobile app development
