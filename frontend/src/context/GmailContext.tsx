import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { GmailSyncResponse } from '../services/api';
import { useAuth } from './AuthContext';

interface GmailContextType {
  isConnected: boolean;
  isLoading: boolean;
  connectGmail: () => Promise<void>;
  disconnectGmail: () => Promise<void>;
  syncGmail: () => Promise<GmailSyncResponse>;
  checkGmailStatus: () => Promise<void>;
}

const GmailContext = createContext<GmailContextType | undefined>(undefined);

export const useGmail = () => {
  const context = useContext(GmailContext);
  if (context === undefined) {
    throw new Error('useGmail must be used within a GmailProvider');
  }
  return context;
};

interface GmailProviderProps {
  children: ReactNode;
}

export const GmailProvider: React.FC<GmailProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const checkGmailStatus = async () => {
    if (!user) {
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    try {
      const status = await api.getGmailStatus();
      setIsConnected(status.is_authenticated);
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkGmailStatus();
    } else {
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [user]);

  const connectGmail = async () => {
    if (!user) {
      toast.error('Please log in to connect Gmail');
      return;
    }

    try {
      setIsLoading(true);
      const { auth_url } = await api.startGmailAuth();
      // Redirect to Gmail auth page
      window.location.href = auth_url;
    } catch (error) {
      toast.error('Failed to start Gmail authentication');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGmail = async () => {
    if (!user) {
      toast.error('Please log in to disconnect Gmail');
      return;
    }

    try {
      setIsLoading(true);
      await api.disconnectGmail();
      setIsConnected(false);
      toast.success('Gmail disconnected successfully');
    } catch (error) {
      toast.error('Failed to disconnect Gmail');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncGmail = async () => {
    if (!user) {
      toast.error('Please log in to sync Gmail');
      throw new Error('User not authenticated');
    }

    try {
      setIsLoading(true);
      const result = await api.syncGmail();
      toast.success(`Synced ${result.stats.new_added} new applications`);
      return result;
    } catch (error) {
      toast.error('Failed to sync Gmail');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GmailContext.Provider
      value={{
        isConnected,
        isLoading,
        connectGmail,
        disconnectGmail,
        syncGmail,
        checkGmailStatus,
      }}
    >
      {children}
    </GmailContext.Provider>
  );
}; 