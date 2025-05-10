import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGmail } from '../context/GmailContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GmailCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkGmailStatus } = useGmail();
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('GmailCallback: Starting callback handling');
        console.log('GmailCallback: Current user:', user);
        console.log('GmailCallback: URL params:', location.search);
        
        // Check if we have the authorization code
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        if (!code) {
          console.error('GmailCallback: No authorization code found in URL');
          toast.error('Failed to connect Gmail: No authorization code');
          navigate('/dashboard');
          return;
        }

        console.log('GmailCallback: Authorization code received');
        const status = await checkGmailStatus();
        console.log('GmailCallback: Status after callback:', status);
        
        if (status.is_authenticated) {
          toast.success('Gmail connected successfully');
        } else {
          toast.error('Failed to connect Gmail: Not authenticated');
        }
        
        navigate('/dashboard');
      } catch (error) {
        console.error('GmailCallback: Error during callback handling:', error);
        toast.error('Failed to connect Gmail');
        navigate('/dashboard');
      }
    };

    handleCallback();
  }, [navigate, checkGmailStatus, location, user]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Connecting Gmail...</h1>
        <p className="text-gray-600">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
} 