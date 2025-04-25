import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGmail } from '../context/GmailContext';
import toast from 'react-hot-toast';

export default function GmailCallback() {
  const navigate = useNavigate();
  const { checkGmailStatus } = useGmail();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await checkGmailStatus();
        navigate('/dashboard'); // Redirect to dashboard after successful connection
      } catch (error) {
        toast.error('Failed to connect Gmail');
        navigate('/dashboard'); // Redirect to dashboard even if there's an error
      }
    };

    handleCallback();
  }, [navigate, checkGmailStatus]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Connecting Gmail...</h1>
        <p className="text-gray-600">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
} 