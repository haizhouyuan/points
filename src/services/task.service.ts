import { apiClient } from './api-client';
import { 
  TaskTemplate, 
  ScheduledTask, 
  QuickCreateTaskRequest, 
  PaginatedResponse,
  ListOptions,
  TaskCategory,
  TaskDifficulty,
  TaskStatus
} from './types';

export class TaskService {
  // Simplified Task Templates API
  async getTaskTemplates(category?: TaskCategory): Promise<TaskTemplate[]> {
    const params = category ? `?category=${category}` : '';
    return apiClient.get(`/tasks/templates${params}`);
  }

  async createTaskTemplate(template: Omit<TaskTemplate, '_id' | 'createdAt' | 'updatedAt'>): Promise<TaskTemplate> {
    return apiClient.post('/tasks/templates', template);
  }

  // Simplified Task Management
  async getTodayTasks(): Promise<ScheduledTask[]> {
    return apiClient.get('/tasks/today');
  }

  async createTask(taskData: QuickCreateTaskRequest): Promise<ScheduledTask> {
    return apiClient.post('/tasks', taskData);
  }

  async updateTask(taskId: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask> {
    return apiClient.put(`/tasks/${taskId}`, updates);
  }

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  }

  // Simplified Task Completion
  async completeTask(taskId: string, notes?: string): Promise<{
    task: ScheduledTask;
    pointsAwarded: number;
  }> {
    return apiClient.post(`/tasks/${taskId}/complete`, { notes });
  }

  async uncompleteTask(taskId: string): Promise<ScheduledTask> {
    return apiClient.post(`/tasks/${taskId}/uncomplete`);
  }

  // Simplified Stats API for family use
  async getTaskStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    totalPoints: number;
  }> {
    return apiClient.get('/tasks/stats');
  }

  async getUserTaskHistory(
    options?: number | {
      limit?: number;
      offset?: number;
      userId?: string;
      status?: TaskStatus;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    tasks: ScheduledTask[];
    totalPoints: number;
    total?: number;
  }> {
    const params = new URLSearchParams();

    if (typeof options === 'number') {
      params.set('limit', options.toString());
    } else if (options) {
      if (typeof options.limit === 'number') params.set('limit', options.limit.toString());
      if (typeof options.offset === 'number') params.set('offset', options.offset.toString());
      if (options.userId) params.set('userId', options.userId);
      if (options.status) params.set('status', options.status);
      if (options.sortBy) params.set('sortBy', options.sortBy);
      if (options.sortOrder) params.set('sortOrder', options.sortOrder);
    }

    const query = params.toString();
    const url = query ? `/tasks/history?${query}` : '/tasks/history';
    return apiClient.get(url);
  }

  // Utility methods
  formatTaskTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} mins`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }

  calculatePointsWithDifficulty(basePoints: number, difficulty: TaskDifficulty): number {
    const multipliers = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.3,
    };
    return Math.round(basePoints * multipliers[difficulty]);
  }

  getCategoryColor(category: TaskCategory): string {
    const colors = {
      exercise: '#22c55e',
      reading: '#3b82f6',
      chores: '#f59e0b',
      learning: '#8b5cf6',
      creativity: '#ec4899',
      other: '#6b7280',
    };
    return colors[category] || colors.other;
  }

  getCategoryIcon(category: TaskCategory): string {
    const icons = {
      exercise: '🏃‍♂️',
      reading: '📚',
      chores: '🧹',
      learning: '🎓',
      creativity: '🎨',
      other: '📋',
    };
    return icons[category] || icons.other;
  }
}

// Export singleton instance
export const taskService = new TaskService();
