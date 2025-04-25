import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, Briefcase } from 'lucide-react';
import { useGmail } from '../context/GmailContext';
import LoadingSpinner from '../components/LoadingSpinner';

const GmailSync: React.FC = () => {
  const { isConnected, isLoading, connectGmail, syncGmail } = useGmail();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const result = await syncGmail();
      setLastSynced(new Date());
    } catch (error) {
      console.error('Error syncing with Gmail:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Format date with time
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gmail Integration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Automatically detect job applications from your Gmail inbox
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className={`p-3 rounded-full ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            } mr-4`}>
              {isConnected ? <CheckCircle size={24} /> : <Mail size={24} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gmail Account
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected 
                  ? 'Your Gmail account is connected' 
                  : 'Connect your Gmail account to get started'}
              </p>
              {lastSynced && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last synced: {formatDateTime(lastSynced)}
                </p>
              )}
            </div>
          </div>
          
          <div>
            {isConnected ? (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {isSyncing ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" />
                    Sync Now
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={connectGmail}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600"
              >
                <Mail size={16} className="mr-2" />
                Connect Gmail
              </button>
            )}
          </div>
        </div>
      </div>

      {isConnected && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
                <Mail size={24} />
              </div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                1. Scan Your Inbox
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We securely scan your inbox for job application confirmation emails
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-3">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                2. Detect Applications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Our system automatically identifies job application confirmations
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-3">
                <Briefcase size={24} />
              </div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                3. Track Automatically
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Applications are added to your tracker with company and position details
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmailSync;