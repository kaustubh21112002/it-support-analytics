import { User } from '../types';

export const DEMO_USERS: User[] = [
  {
    id: 'usr-emp-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@company.com',
    role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    departmentId: 4,
    departmentName: 'Finance & Administration',
    title: 'Senior Financial Analyst'
  },
  {
    id: 'usr-agt-1',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@company.com',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    departmentId: 1,
    departmentName: 'Corporate IT',
    title: 'Lead Support Specialist (Service Desk)',
    agentId: 1
  },
  {
    id: 'usr-mgr-1',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@company.com',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    departmentId: 1,
    departmentName: 'Corporate IT',
    title: 'IT Service Delivery & Operations Manager'
  },
  {
    id: 'usr-adm-1',
    name: 'Vikram Singh',
    email: 'admin.analytics@company.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    departmentId: 1,
    departmentName: 'Corporate IT',
    title: 'Principal Systems & Governance Architect'
  }
];
