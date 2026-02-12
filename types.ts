
export enum UserRole {
  TEEN = 'TEEN',
  ELDER = 'ELDER',
  ADMIN = 'ADMIN'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED'
}

export enum TaskCategory {
  TECH = 'Tech Support',
  GROCERY = 'Grocery Shopping',
  GARDEN = 'Garden Help',
  SOCIAL = 'Companionship',
  ADMIN = 'Light Admin'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  credits: number;
  avatar: string;
  bio?: string;
  isVerified: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  requesterId: string;
  helperId?: string;
  status: TaskStatus;
  creditValue: number;
  location: string;
  createdAt: number;
}

export interface CommunityImpact {
  totalTasks: number;
  activeTeens: number;
  activeElders: number;
  creditsDistributed: number;
}
