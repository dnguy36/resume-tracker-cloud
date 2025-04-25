import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Resume } from '../types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface ResumeContextType {
  resumes: Resume[];
  loading: boolean;
  uploadResume: (file: File, name: string, version: string) => Promise<void>;
  deleteResume: (id: string) => void;
  downloadResume: (id: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const useResumes = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResumes must be used within a ResumeProvider');
  }
  return context;
};

interface ResumeProviderProps {
  children: ReactNode;
}

export const ResumeProvider: React.FC<ResumeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  // Load resumes from localStorage when component mounts or user changes
  useEffect(() => {
    if (user) {
      const storedResumes = localStorage.getItem(`resumes_${user.id}`);
      if (storedResumes) {
        setResumes(JSON.parse(storedResumes));
      } else {
        // Set mock data for demo purposes
        const mockResumes: Resume[] = [
          {
            id: '1',
            userId: user.id,
            name: 'Software Engineer Resume',
            version: '1.0',
            fileUrl: '#',
            uploadDate: new Date().toISOString(),
            fileSize: 256000
          },
          {
            id: '2',
            userId: user.id,
            name: 'Frontend Developer Resume',
            version: '2.1',
            fileUrl: '#',
            uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            fileSize: 312000
          }
        ];
        setResumes(mockResumes);
        localStorage.setItem(`resumes_${user.id}`, JSON.stringify(mockResumes));
      }
    } else {
      setResumes([]);
    }
    setLoading(false);
  }, [user]);

  // Save resumes to localStorage whenever they change
  useEffect(() => {
    if (user && resumes.length > 0) {
      localStorage.setItem(`resumes_${user.id}`, JSON.stringify(resumes));
    }
  }, [resumes, user]);

  const uploadResume = async (file: File, name: string, version: string) => {
    try {
      if (!user) return;
      
      setLoading(true);
      // Mock file upload - in a real app, this would upload to AWS S3
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newResume: Resume = {
        id: Date.now().toString(),
        userId: user.id,
        name,
        version,
        fileUrl: URL.createObjectURL(file), // This is temporary and will be lost on page refresh
        uploadDate: new Date().toISOString(),
        fileSize: file.size
      };
      
      setResumes(prev => [...prev, newResume]);
      toast.success('Resume uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = (id: string) => {
    setResumes(prev => prev.filter(resume => resume.id !== id));
    toast.success('Resume deleted');
  };

  const downloadResume = (id: string) => {
    const resume = resumes.find(r => r.id === id);
    if (resume) {
      // In a real app, this would download from AWS S3
      toast.success('Resume download started');
    } else {
      toast.error('Resume not found');
    }
  };

  return (
    <ResumeContext.Provider value={{
      resumes,
      loading,
      uploadResume,
      deleteResume,
      downloadResume
    }}>
      {children}
    </ResumeContext.Provider>
  );
};