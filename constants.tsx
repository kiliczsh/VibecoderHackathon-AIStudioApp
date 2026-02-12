import { Task, TaskCategory, TaskStatus, User, UserRole } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 't1',
    name: 'Leo Chen',
    role: UserRole.TEEN,
    credits: 450,
    avatar: 'https://picsum.photos/seed/t1/150/150',
    bio: '11th grader at Westside High. Love tech and chess.',
    isVerified: true,
  },
  {
    id: 'e1',
    name: 'Margaret Wilson',
    role: UserRole.ELDER,
    credits: 100,
    avatar: 'https://picsum.photos/seed/e1/150/150',
    bio: 'Retired librarian. Enjoys historical novels and tea.',
    isVerified: true,
  },
  {
    id: 'a1',
    name: 'City Manager Sarah',
    role: UserRole.ADMIN,
    credits: 0,
    avatar: 'https://picsum.photos/seed/a1/150/150',
    isVerified: true,
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'iPad Email Setup',
    description: 'I need help setting up my new iPad to receive emails from my grandkids.',
    category: TaskCategory.TECH,
    requesterId: 'e1',
    status: TaskStatus.OPEN,
    creditValue: 50,
    location: 'Maple Street Community Center',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'task-2',
    title: 'Weekly Grocery Run',
    description: 'Looking for someone to pick up a few heavy items from the corner market.',
    category: TaskCategory.GROCERY,
    requesterId: 'e1',
    status: TaskStatus.IN_PROGRESS,
    helperId: 't1',
    creditValue: 30,
    location: 'North 4th Street',
    createdAt: Date.now() - 43200000,
  },
  {
    id: 'task-3',
    title: 'Light Weeding',
    description: 'Small flower bed needs some attention before the sun gets too hot.',
    category: TaskCategory.GARDEN,
    requesterId: 'e1',
    status: TaskStatus.COMPLETED,
    helperId: 't1',
    creditValue: 40,
    location: 'Oak Avenue',
    createdAt: Date.now() - 172800000,
  }
];

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  [TaskCategory.TECH]: 'bg-slate-100 text-forest border-slate-200',
  [TaskCategory.GROCERY]: 'bg-leaf/20 text-forest border-leaf/30',
  [TaskCategory.GARDEN]: 'bg-leaf text-forest border-leaf/50',
  [TaskCategory.SOCIAL]: 'bg-earth/20 text-forest border-earth/30',
  [TaskCategory.ADMIN]: 'bg-sand text-forest border-sand/50',
};