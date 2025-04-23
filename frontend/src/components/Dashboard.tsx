import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import GmailIntegration from './GmailIntegration';
import toast from 'react-hot-toast';
import DashboardMetrics from './DashboardMetrics';

interface Resume {
  id: string;
  filename: string;
  url: string;
  upload_date: string;
}

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  application_date: string;
  status_color: string;
  source: string;
}

export default function Dashboard() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGmailAuthenticated, setIsGmailAuthenticated] = useState(false);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [clearingApplications, setClearingApplications] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setResumes(data.resumes);
        setApplications(data.applications);
      } else {
        setError(data.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      setError('An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    checkGmailAuth();
  }, []);

  const checkGmailAuth = async () => {
    try {
      const response = await fetch('/api/gmail/status', {
        credentials: 'include'
      });
      const data = await response.json();
      setIsGmailAuthenticated(data.is_authenticated);
    } catch (error) {
      console.error('Error checking Gmail auth status:', error);
    }
  };

  const handleGmailSync = async () => {
    setSyncingGmail(true);
    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to sync Gmail');
      }

      const data = await response.json();
      toast.success(data.message);
      // Refresh dashboard data to show new applications
      await fetchDashboardData();
    } catch (error) {
      console.error('Error syncing Gmail:', error);
      toast.error('Failed to sync Gmail');
    } finally {
      setSyncingGmail(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setResumes(resumes.filter(resume => resume.id !== resumeId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete resume');
      }
    } catch (error) {
      setError('An error occurred while deleting the resume');
    }
  };

  const handleClearApplications = async () => {
    if (!window.confirm('Are you sure you want to clear all job applications? This action cannot be undone.')) {
      return;
    }

    setClearingApplications(true);
    try {
      const response = await fetch('/api/applications/clear', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to clear applications');
      }

      const data = await response.json();
      setApplications([]);
      toast.success(data.message);
    } catch (error) {
      console.error('Error clearing applications:', error);
      toast.error('Failed to clear applications');
    } finally {
      setClearingApplications(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-12">
          <DashboardMetrics applications={applications} />
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h3 className="card-title mb-0">My Resumes</h3>
            </div>
            <div className="card-body">
              {resumes.length > 0 ? (
                <div className="list-group">
                  {resumes.map(resume => (
                    <div key={resume.id} className="list-group-item">
                      <div>
                        <h5 className="mb-1">{resume.filename}</h5>
                        <small className="text-muted">
                          Uploaded: {new Date(resume.upload_date).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="btn-group">
                        <a
                          href={resume.url}
                          className="btn btn-sm btn-outline-primary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="fas fa-download"></i>
                        </a>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteResume(resume.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted">No resumes uploaded yet.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title mb-0">Job Applications</h3>
              <button
                className="btn btn-danger"
                onClick={handleClearApplications}
                disabled={clearingApplications || applications.length === 0}
              >
                {clearingApplications ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Clearing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash me-2"></i>
                    Clear All Applications
                  </>
                )}
              </button>
            </div>
            <div className="card-body">
              {applications.length > 0 ? (
                <div className="list-group">
                  {applications.map(app => (
                    <div key={app.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1">{app.company}</h5>
                          <p className="mb-1">{app.position}</p>
                          <small className="text-muted">
                            Applied: {new Date(app.application_date).toLocaleDateString()}
                          </small>
                        </div>
                        <span className={`badge bg-${app.status_color || 'primary'}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted">No job applications tracked yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <GmailIntegration
            isAuthenticated={isGmailAuthenticated}
            onSync={handleGmailSync}
            syncing={syncingGmail}
          />
        </div>
      </div>
    </div>
  );
} 