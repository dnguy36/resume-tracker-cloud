import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Application, ApplicationStatus } from '../types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface ApplicationContextType {
  applications: Application[];
  loading: boolean;
  addApplication: (application: Omit<Application, 'id' | 'userId'>) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
  clearAllApplications: () => void;
  syncWithGmail: () => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const useApplications = () => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationProvider');
  }
  return context;
};

interface ApplicationProviderProps {
  children: ReactNode;
}

export const ApplicationProvider: React.FC<ApplicationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Load applications from API when component mounts or user changes
  useEffect(() => {
    const loadApplications = async () => {
      if (!user) {
        setApplications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.getApplications();
        // Transform the backend response to match our Application type
        const transformedApplications: Application[] = response.applications.map(app => ({
          id: app.id,
          userId: user.id,
          company: app.company,
          position: app.position,
          status: app.status as ApplicationStatus,
          applicationDate: app.application_date,
          source: app.source,
          confidence: app.confidence,
          statusColor: app.status_color
        }));
        setApplications(transformedApplications);
      } catch (error) {
        console.error('Failed to load applications:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load applications';
        toast.error(errorMessage);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [user]);

  const addApplication = async (applicationData: Omit<Application, 'id' | 'userId'>) => {
    if (!user) {
      toast.error('Please log in to add applications');
      return;
    }
    
    try {
      const response = await api.addApplication(applicationData);
      setApplications(prev => [...prev, response.application]);
      toast.success('Application added successfully');
    } catch (error) {
      toast.error('Failed to add application');
      throw error;
    }
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    if (!user) {
      toast.error('Please log in to update applications');
      return;
    }

    try {
      const response = await api.updateApplication(id, updates);
      setApplications(prev => 
        prev.map(app => app.id === id ? response.application : app)
      );
      toast.success('Application updated');
    } catch (error) {
      toast.error('Failed to update application');
      throw error;
    }
  };

  const deleteApplication = async (id: string) => {
    if (!user) {
      toast.error('Please log in to delete applications');
      return;
    }

    try {
      await api.deleteApplication(id);
      setApplications(prev => prev.filter(app => app.id !== id));
      toast.success('Application deleted');
    } catch (error) {
      toast.error('Failed to delete application');
      throw error;
    }
  };

  const clearAllApplications = async () => {
    if (!user) {
      toast.error('Please log in to clear applications');
      return;
    }
    
    try {
      await api.clearApplications();
      setApplications([]);
      toast.success('All applications cleared');
    } catch (error) {
      toast.error('Failed to clear applications');
      throw error;
    }
  };

  const syncWithGmail = async () => {
    if (!user) {
      toast.error('Please log in to sync with Gmail');
      return;
    }

    try {
      setLoading(true);
      const response = await api.syncGmail();
      
      // Transform and add new applications from Gmail sync
      if (response.applications.length > 0) {
        const transformedApplications: Application[] = response.applications.map(app => ({
          id: app.id,
          userId: user.id,
          company: app.company,
          position: app.position,
          status: app.status as ApplicationStatus,
          applicationDate: app.application_date,
          source: app.source,
          confidence: app.confidence,
          statusColor: app.status_color
        }));
        setApplications(prev => [...prev, ...transformedApplications]);
        toast.success(`Synced ${response.stats.new_added} new applications from Gmail`);
      } else {
        toast.success('No new applications found in Gmail');
      }
    } catch (error) {
      toast.error('Failed to sync with Gmail');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApplicationContext.Provider value={{
      applications,
      loading,
      addApplication,
      updateApplication,
      deleteApplication,
      clearAllApplications,
      syncWithGmail
    }}>
      {children}
    </ApplicationContext.Provider>
  );
};