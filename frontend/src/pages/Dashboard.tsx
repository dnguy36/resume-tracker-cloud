import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Mail, 
  ArrowRight, 
  PieChart,
  BarChart,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import { useResumes } from '../context/ResumeContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { ApplicationStatus } from '../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { applications, loading: applicationsLoading } = useApplications();
  const { resumes, loading: resumesLoading } = useResumes();

  const loading = applicationsLoading || resumesLoading;

  // Calculate statistics
  const stats = useMemo(() => {
    const totalApplications = applications.length;
    
    // Count applications by status
    const statusCounts: Record<ApplicationStatus, number> = {
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      no_response: 0
    };
    
    applications.forEach(app => {
      statusCounts[app.status]++;
    });
    
    // Calculate rates
    const interviewRate = totalApplications > 0 
      ? (statusCounts.interview + statusCounts.offer + statusCounts.rejected) / totalApplications * 100 
      : 0;
      
    const offerRate = totalApplications > 0 
      ? statusCounts.offer / totalApplications * 100 
      : 0;
    
    // Get recent applications (last 5)
    const recentApplications = [...applications]
      .sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime())
      .slice(0, 5);
    
    return {
      totalApplications,
      statusCounts,
      interviewRate,
      offerRate,
      recentApplications
    };
  }, [applications]);

  // Prepare chart data
  const statusChartData = {
    labels: ['Applied', 'Interview', 'Offer', 'Rejected', 'No Response'],
    datasets: [
      {
        data: [
          stats.statusCounts.applied,
          stats.statusCounts.interview,
          stats.statusCounts.offer,
          stats.statusCounts.rejected,
          stats.statusCounts.no_response
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)', // blue
          'rgba(139, 92, 246, 0.7)', // purple
          'rgba(16, 185, 129, 0.7)', // green
          'rgba(239, 68, 68, 0.7)',  // red
          'rgba(156, 163, 175, 0.7)' // gray
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Create a date formatter
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  if (loading) {
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
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name}! Here's an overview of your job search.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interview Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.interviewRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
              <BarChart size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offer Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.offerRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-4">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resumes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Status Breakdown Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <PieChart size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            Application Status
          </h2>
          
          {stats.totalApplications > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Pie 
                data={statusChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
                        padding: 10,
                        usePointStyle: true,
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                No application data to display
              </p>
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Briefcase size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
              Recent Applications
            </h2>
            <Link 
              to="/applications" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
            >
              View all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {stats.recentApplications.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.recentApplications.map((application) => (
                    <tr key={application.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {application.company}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {application.position}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(application.applicationDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={application.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No applications yet</p>
              <Link 
                to="/applications" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Add your first application
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/applications" 
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Track Application</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add a new job application</p>
            </div>
          </Link>
          
          <Link 
            to="/resumes" 
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-3">
              <FileText size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Upload Resume</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your resume versions</p>
            </div>
          </Link>
          
          <Link 
            to="/gmail" 
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-3">
              <Mail size={20} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Sync Gmail</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Import applications from emails</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;