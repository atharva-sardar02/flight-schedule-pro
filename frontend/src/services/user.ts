/**
 * User Service
 * Handles user-related API calls
 */

import api from './api';
import { User } from '../types/user';

export interface ListUsersResponse {
  users: any[]; // Backend returns snake_case
  count: number;
}

export interface ListUsersFilters {
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  limit?: number;
  offset?: number;
}

/**
 * Map backend user (snake_case) to frontend User (camelCase)
 */
function mapBackendUser(backendUser: any): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    firstName: backendUser.first_name,
    lastName: backendUser.last_name,
    name: `${backendUser.first_name} ${backendUser.last_name}`.trim(),
    phoneNumber: backendUser.phone_number,
    role: backendUser.role as any,
    trainingLevel: backendUser.training_level as any,
    createdAt: backendUser.created_at,
    updatedAt: backendUser.updated_at,
  };
}

class UserService {
  /**
   * List users with optional filters
   */
  async listUsers(filters: ListUsersFilters = {}): Promise<{ users: User[]; count: number }> {
    const params = new URLSearchParams();
    
    if (filters.role) {
      params.append('role', filters.role);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    const queryString = params.toString();
    const url = `/api/users/list${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<ListUsersResponse>(url);
    
    // Map backend users to frontend format
    const users = response.data.users.map(mapBackendUser);
    
    return {
      users,
      count: response.data.count,
    };
  }

  /**
   * Get list of instructors
   */
  async getInstructors(): Promise<User[]> {
    const response = await this.listUsers({ role: 'INSTRUCTOR', limit: 100 });
    return response.users;
  }

  /**
   * Get list of students
   */
  async getStudents(): Promise<User[]> {
    const response = await this.listUsers({ role: 'STUDENT', limit: 100 });
    return response.users;
  }
}

export default new UserService();

