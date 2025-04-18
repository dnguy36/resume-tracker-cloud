import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GmailSyncProps {
  onSync: () => void;
}

const GmailSync: React.FC<GmailSyncProps> = ({ onSync }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      const response = await fetch('/api/gmail/status', {
        credentials: 'include'
      });
      const data = await response.json();
      setIsAuthenticated(data.is_authenticated);
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/gmail', {
        credentials: 'include'
      });
      const data = await response.json();
      window.location.href = data.auth_url;
    } catch (error) {
      setError('Failed to connect to Gmail');
      console.error('Gmail auth error:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        onSync();
      } else {
        setError(data.error || 'Failed to sync with Gmail');
      }
    } catch (error) {
      setError('Failed to sync with Gmail');
      console.error('Gmail sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="gmail-sync">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gmail Integration</h5>
          {isAuthenticated && (
            <span className="badge bg-success">Connected</span>
          )}
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <p className="card-text">
            {isAuthenticated
              ? "Import your job applications directly from Gmail."
              : "Connect your Gmail account to automatically track job applications from your emails."}
          </p>

          {isAuthenticated ? (
            <button
              className="btn btn-primary"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Syncing...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt me-2"></i>
                  Sync Applications
                </>
              )}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleConnect}
            >
              <i className="fab fa-google me-2"></i>
              Connect Gmail
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GmailSync; 