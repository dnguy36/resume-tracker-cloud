import { User, Application } from '../types';

const API_URL = 'http://localhost:5000/api';

interface LoginResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface GmailStatusResponse {
  is_authenticated: boolean;
}

export interface GmailSyncResponse {
  message: string;
  applications: Array<{
    id: string;
    company: string;
    position: string;
    status: string;
    status_color: string;
    application_date: string;
    source: string;
    confidence: number;
  }>;
  stats: {
    total_processed: number;
    new_added: number;
    source: string;
  };
}

interface ApplicationsResponse {
  applications: Application[];
}

interface ApplicationResponse {
  application: Application;
}

export const api = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  async register(username: string, email: string, password: string): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  },

  async checkAuth(): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/check-auth`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.username,
      };
    } catch (error) {
      console.error('Auth check failed:', error);
      return null;
    }
  },

  // Gmail methods
  async getGmailStatus(): Promise<GmailStatusResponse> {
    const response = await fetch(`${API_URL}/gmail/status`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get Gmail status');
    }

    return response.json();
  },

  async disconnectGmail(): Promise<void> {
    const response = await fetch(`${API_URL}/gmail/disconnect`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect Gmail');
    }
  },

  async syncGmail(): Promise<GmailSyncResponse> {
    const response = await fetch(`${API_URL}/gmail/sync`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync Gmail');
    }

    return response.json();
  },

  async startGmailAuth(): Promise<{ auth_url: string }> {
    const response = await fetch(`${API_URL}/auth/gmail`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to start Gmail authentication');
    }

    return response.json();
  },

  // Application methods
  async getApplications(): Promise<ApplicationsResponse> {
    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch applications: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  async addApplication(application: Omit<Application, 'id' | 'userId'>): Promise<ApplicationResponse> {
    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(application),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add application');
    }

    return response.json();
  },

  async updateApplication(id: string, updates: Partial<Application>): Promise<ApplicationResponse> {
    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update application');
    }

    return response.json();
  },

  async deleteApplication(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/applications/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete application');
    }
  },

  async clearApplications(): Promise<void> {
    const response = await fetch(`${API_URL}/applications/clear`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to clear applications');
    }
  },
}; 