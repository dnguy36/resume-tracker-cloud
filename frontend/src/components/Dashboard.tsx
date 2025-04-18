import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  apply_date: string;
  status_color: string;
}

const Dashboard = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, []);

  const handleDeleteResume = async (resumeId: string) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
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
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div className="row mb-4">
        <div className="col">
          <h2>Dashboard</h2>
        </div>
        <div className="col-auto">
          <Link to="/upload" className="btn btn-primary">
            <i className="fas fa-upload"></i> Upload Resume
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Resumes Section */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h3 className="card-title mb-0">My Resumes</h3>
            </div>
            <div className="card-body">
              {resumes.length > 0 ? (
                <div className="list-group">
                  {resumes.map(resume => (
                    <div key={resume.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted">No resumes uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Job Applications Section */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h3 className="card-title mb-0">Job Applications</h3>
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
                            Applied: {new Date(app.apply_date).toLocaleDateString()}
                          </small>
                        </div>
                        <span className={`badge bg-${app.status_color}`}>
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
      </div>
    </div>
  );
};

export default Dashboard; 