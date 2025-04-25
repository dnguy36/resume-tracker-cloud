import React, { ReactNode } from 'react';
import { FileText, Briefcase, Mail } from 'lucide-react';

interface EmptyStateProps {
  type: 'resumes' | 'applications' | 'gmail';
  message?: string;
  action?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  message, 
  action 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'resumes':
        return <FileText className="h-12 w-12 text-gray-400" />;
      case 'applications':
        return <Briefcase className="h-12 w-12 text-gray-400" />;
      case 'gmail':
        return <Mail className="h-12 w-12 text-gray-400" />;
      default:
        return <FileText className="h-12 w-12 text-gray-400" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'resumes':
        return 'No resumes uploaded yet';
      case 'applications':
        return 'No job applications tracked yet';
      case 'gmail':
        return 'No emails synced from Gmail yet';
      default:
        return 'No data available';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-4 mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {message || getDefaultMessage()}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
        {type === 'resumes' && 'Upload your resume versions to keep track of which one you used for each application.'}
        {type === 'applications' && 'Start tracking your job applications to monitor your progress and success rate.'}
        {type === 'gmail' && 'Connect your Gmail account to automatically detect and track job applications from confirmation emails.'}
      </p>
      {action}
    </div>
  );
};

export default EmptyState;