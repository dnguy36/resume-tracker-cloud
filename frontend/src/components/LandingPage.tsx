import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faEnvelope, faFileAlt, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="hero-title">Track Your Job Search Journey</h1>
              <p className="hero-subtitle">
                Streamline your job applications, manage resumes, and track your progress all in one place.
              </p>
              <div className="hero-buttons">
                <Link to="/register" className="btn btn-primary btn-lg me-3">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline-primary btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <img 
                src="/hero-image.svg" 
                alt="Resume Tracker Dashboard" 
                className="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="text-center mb-5">Why Choose Resume Tracker?</h2>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="feature-card">
                <FontAwesomeIcon icon={faFileAlt} className="feature-icon" />
                <h3>Resume Management</h3>
                <p>Store and organize multiple versions of your resume in one secure location.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-card">
                <FontAwesomeIcon icon={faChartLine} className="feature-icon" />
                <h3>Application Tracking</h3>
                <p>Monitor your application status and track responses from employers.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-card">
                <FontAwesomeIcon icon={faEnvelope} className="feature-icon" />
                <h3>Gmail Integration</h3>
                <p>Automatically sync your job application emails and track responses.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-card">
                <FontAwesomeIcon icon={faMagicWandSparkles} className="feature-icon" />
                <h3>Smart Analytics</h3>
                <p>Get insights into your application success rate and interview progress.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container text-center">
          <h2>Ready to Organize Your Job Search?</h2>
          <p className="mb-4">Join thousands of job seekers who have streamlined their application process.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Tracking Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 