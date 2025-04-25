import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter, 
  X, 
  ChevronDown,
  ChevronUp,
  Calendar,
  Mail
} from 'lucide-react';
import { useApplications } from '../context/ApplicationContext';
import { useResumes } from '../context/ResumeContext';
import { useGmail } from '../context/GmailContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { Application, ApplicationStatus, Resume } from '../types';

const Applications: React.FC = () => {
  const { applications, loading, addApplication, updateApplication, deleteApplication, clearAllApplications, syncWithGmail } = useApplications();
  const { resumes } = useResumes();
  const { isConnected, isLoading: gmailLoading, connectGmail, disconnectGmail } = useGmail();
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ApplicationStatus>('applied');
  const [notes, setNotes] = useState('');
  const [resumeId, setResumeId] = useState<string | undefined>(undefined);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'company' | 'position' | 'applicationDate'>('applicationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Confirmation dialogs
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDisconnectGmail, setConfirmDisconnectGmail] = useState(false);

  // Reset form
  const resetForm = () => {
    setCurrentId(null);
    setCompany('');
    setPosition('');
    setApplicationDate(new Date().toISOString().split('T')[0]);
    setStatus('applied');
    setNotes('');
    setResumeId(undefined);
    setIsEditing(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const applicationData = {
      company,
      position,
      applicationDate: new Date(applicationDate).toISOString(),
      status,
      notes: notes || undefined,
      resumeId: resumeId || undefined
    };
    
    if (isEditing && currentId) {
      updateApplication(currentId, applicationData);
    } else {
      addApplication(applicationData);
    }
    
    resetForm();
    setShowForm(false);
  };

  // Edit application
  const handleEdit = (application: Application) => {
    setCurrentId(application.id);
    setCompany(application.company);
    setPosition(application.position);
    setApplicationDate(new Date(application.applicationDate).toISOString().split('T')[0]);
    setStatus(application.status);
    setNotes(application.notes || '');
    setResumeId(application.resumeId);
    setIsEditing(true);
    setShowForm(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      deleteApplication(confirmDelete);
      setConfirmDelete(null);
    }
  };

  // Handle clear all confirmation
  const handleClearAllConfirm = () => {
    clearAllApplications();
    setConfirmClearAll(false);
  };

  // Handle Gmail disconnect confirmation
  const handleDisconnectGmailConfirm = () => {
    disconnectGmail();
    setConfirmDisconnectGmail(false);
  };

  // Toggle sort direction or change sort field
  const handleSort = (field: 'company' | 'position' | 'applicationDate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    return applications
      .filter(app => {
        // Apply status filter
        if (statusFilter !== 'all' && app.status !== statusFilter) {
          return false;
        }
        
        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            app.company.toLowerCase().includes(searchLower) ||
            app.position.toLowerCase().includes(searchLower) ||
            (app.notes && app.notes.toLowerCase().includes(searchLower))
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortField === 'applicationDate') {
          const dateA = new Date(a.applicationDate).getTime();
          const dateB = new Date(b.applicationDate).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          const valueA = a[sortField].toLowerCase();
          const valueB = b[sortField].toLowerCase();
          return sortDirection === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
      });
  }, [applications, statusFilter, searchTerm, sortField, sortDirection]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  // Get resume name by ID
  const getResumeName = (id?: string) => {
    if (!id) return null;
    const resume = resumes.find(r => r.id === id);
    return resume ? `${resume.name} (v${resume.version})` : null;
  };

  if (loading || gmailLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Job Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your job applications
          </p>
        </div>
        <div className="flex space-x-2">
          {isConnected ? (
            <>
              <button
                onClick={syncWithGmail}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Mail size={16} className="mr-2" />
                Sync Gmail
              </button>
              <button
                onClick={() => setConfirmDisconnectGmail(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Mail size={16} className="mr-2" />
                Disconnect Gmail
              </button>
            </>
          ) : (
            <button
              onClick={connectGmail}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Mail size={16} className="mr-2" />
              Connect Gmail
            </button>
          )}
          {applications.length > 0 && (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Trash2 size={16} className="mr-2" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={16} className="mr-2" />
            Add Application
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isEditing ? 'Edit Application' : 'Add New Application'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Google"
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="applicationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Application Date
                </label>
                <input
                  type="date"
                  id="applicationDate"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="no_response">No Response</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="resumeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resume Used (Optional)
              </label>
              <select
                id="resumeId"
                value={resumeId || ''}
                onChange={(e) => setResumeId(e.target.value || undefined)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a resume</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.name} (v{resume.version})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Any additional notes about this application..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {isEditing ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {applications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search applications..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter size={16} className="mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp size={16} className="ml-1" />
                ) : (
                  <ChevronDown size={16} className="ml-1" />
                )}
              </button>
              
              {statusFilter !== 'all' && (
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Filter by Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusFilter === 'all'
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('applied')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusFilter === 'applied'
                          ? 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                      }`}
                    >
                      Applied
                    </button>
                    <button
                      onClick={() => setStatusFilter('interview')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusFilter === 'interview'
                          ? 'bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                      }`}
                    >
                      Interview
                    </button>
                    <button
                      onClick={() => setStatusFilter('offer')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusFilter === 'offer'
                          ? 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                    >
                      Offer
                    </button>
                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusFilter === 'rejected'
                          ? 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                      }`}
                    >
                      Rejected
                    </button>
                    <button
                      onClick={() => setStatusFilter('no_response')}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusFilter === 'no_response'
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      No Response
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sort by
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSort('company')}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        sortField === 'company'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Company
                      {sortField === 'company' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSort('position')}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        sortField === 'position'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Position
                      {sortField === 'position' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />
                      )}
                    </button>
                    <button
                      onClick={() => handleSort('applicationDate')}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        sortField === 'applicationDate'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Date
                      {sortField === 'applicationDate' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {applications.length > 0 ? (
        <>
          {filteredApplications.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Position
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Resume
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              <Briefcase size={20} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {application.company}
                              </div>
                              {application.emailId && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Via Gmail
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{application.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {formatDate(application.applicationDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={application.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getResumeName(application.resumeId) || 'None'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(application)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(application.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No applications match your filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X size={16} className="mr-2" />
                Clear filters
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState 
          type="applications" 
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              <Plus size={16} className="mr-2" />
              Add your first application
            </button>
          }
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
        danger
      />

      <ConfirmDialog
        isOpen={confirmClearAll}
        title="Clear All Applications"
        message="Are you sure you want to delete all applications? This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        onConfirm={handleClearAllConfirm}
        onCancel={() => setConfirmClearAll(false)}
        danger
      />

      <ConfirmDialog
        isOpen={confirmDisconnectGmail}
        title="Disconnect Gmail"
        message="Are you sure you want to disconnect Gmail? This will stop syncing applications from your Gmail account."
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        onConfirm={handleDisconnectGmailConfirm}
        onCancel={() => setConfirmDisconnectGmail(false)}
      />
    </div>
  );
};

export default Applications;