export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Resume {
  id: string;
  userId: string;
  name: string;
  version: string;
  fileUrl: string;
  uploadDate: string;
  fileSize: number;
}

export type ApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected' | 'no_response';

export interface Application {
  id: string;
  userId: string;
  company: string;
  position: string;
  resumeId?: string;
  applicationDate: string;
  status: ApplicationStatus;
  notes?: string;
  emailId?: string;
  source?: string;
  confidence?: number;
  statusColor?: string;
}

export interface DashboardStats {
  totalApplications: number;
  statusBreakdown: Record<ApplicationStatus, number>;
  interviewRate: number;
  offerRate: number;
  recentApplications: Application[];
}