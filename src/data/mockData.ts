import type { User, ContentItem, DashboardStats } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'John Smith', email: 'john@example.com', role: 'admin', status: 'active', createdAt: '2024-01-15' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'editor', status: 'active', createdAt: '2024-02-20' },
  { id: '3', name: 'Mike Wilson', email: 'mike@example.com', role: 'viewer', status: 'active', createdAt: '2024-03-10' },
  { id: '4', name: 'Emily Brown', email: 'emily@example.com', role: 'editor', status: 'inactive', createdAt: '2024-01-25' },
  { id: '5', name: 'David Lee', email: 'david@example.com', role: 'viewer', status: 'active', createdAt: '2024-04-05' },
];

export const mockContent: ContentItem[] = [
  { id: '1', title: 'Welcome to Our Platform', type: 'page', status: 'published', author: 'John Smith', updatedAt: '2024-12-01' },
  { id: '2', title: 'Getting Started Guide', type: 'post', status: 'published', author: 'Sarah Johnson', updatedAt: '2024-12-05' },
  { id: '3', title: 'Product Announcement', type: 'post', status: 'draft', author: 'John Smith', updatedAt: '2024-12-10' },
  { id: '4', title: 'Company Logo', type: 'media', status: 'published', author: 'Emily Brown', updatedAt: '2024-11-20' },
  { id: '5', title: 'FAQ Page', type: 'page', status: 'published', author: 'Mike Wilson', updatedAt: '2024-12-08' },
];

export const mockStats: DashboardStats = {
  totalUsers: 156,
  activeUsers: 142,
  totalContent: 89,
  publishedContent: 72,
};
