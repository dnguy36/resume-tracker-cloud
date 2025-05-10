import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { GmailSyncResponse, GmailStatusResponse } from '../services/api';
import { useAuth } from './AuthContext';

interface GmailContextType {
  isConnected: boolean;
  isLoading: boolean;
  connectGmail: () => Promise<void>;
  disconnectGmail: () => Promise<void>;
  syncGmail: () => Promise<GmailSyncResponse>;
  checkGmailStatus: () => Promise<GmailStatusResponse>;
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
      console.log('GmailContext: No user found, setting isConnected to false');
      setIsConnected(false);
      setIsLoading(false);
      return { is_authenticated: false };
    }

    try {
      console.log('GmailContext: Checking Gmail status for user:', user.id);
      const status = await api.getGmailStatus();
      console.log('GmailContext: Received status:', status);
      setIsConnected(status.is_authenticated);
      return status;
    } catch (error) {
      console.error('GmailContext: Failed to check Gmail status:', error);
      setIsConnected(false);
      return { is_authenticated: false };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('GmailContext: User found, checking Gmail status');
      checkGmailStatus();
    } else {
      console.log('GmailContext: No user found, setting isConnected to false');
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [user]);

  const connectGmail = async () => {
    if (!user) {
      console.error('GmailContext: No user found when trying to connect Gmail');
      toast.error('Please log in to connect Gmail');
      return;
    }

    try {
      console.log('GmailContext: Starting Gmail authentication for user:', user.id);
      setIsLoading(true);
      const { auth_url } = await api.startGmailAuth();
      console.log('GmailContext: Received auth URL:', auth_url);
      // Redirect to Gmail auth page
      window.location.href = auth_url;
    } catch (error) {
      console.error('GmailContext: Failed to start Gmail authentication:', error);
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