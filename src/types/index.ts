export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'page' | 'post' | 'media';
  status: 'published' | 'draft';
  author: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  publishedContent: number;
}
