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
  // Task Templates API
  async getTaskTemplates(options?: ListOptions): Promise<PaginatedResponse<TaskTemplate>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params.set(key, value.toString());
      });
    }

    return apiClient.get(`/tasks/templates?${params.toString()}`);
  }

  async getTaskTemplate(templateId: string): Promise<TaskTemplate> {
    return apiClient.get(`/tasks/templates/${templateId}`);
  }

  async searchTaskTemplates(query: string, category?: TaskCategory): Promise<TaskTemplate[]> {
    const params = new URLSearchParams({ q: query });
    if (category) params.set('category', category);
    
    return apiClient.get(`/tasks/templates/search?${params.toString()}`);
  }

  async createTaskTemplate(template: Omit<TaskTemplate, '_id' | 'createdAt' | 'updatedAt'>): Promise<TaskTemplate> {
    return apiClient.post('/tasks/templates', template);
  }

  async updateTaskTemplate(templateId: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate> {
    return apiClient.put(`/tasks/templates/${templateId}`, updates);
  }

  async deleteTaskTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`/tasks/templates/${templateId}`);
  }

  // Scheduled Tasks API
  async getScheduledTasks(options?: ListOptions & {
    date?: string;
    status?: TaskStatus;
    assignedTo?: string;
  }): Promise<PaginatedResponse<ScheduledTask>> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.date) params.set('date', options.date);
    if (options?.status) params.set('status', options.status);
    if (options?.assignedTo) params.set('assignedTo', options.assignedTo);
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);

    return apiClient.get(`/tasks/scheduled?${params.toString()}`);
  }

  async getScheduledTask(taskId: string): Promise<ScheduledTask> {
    return apiClient.get(`/tasks/scheduled/${taskId}`);
  }

  async getTasksByDateRange(startDate: string, endDate: string, assignedTo?: string): Promise<ScheduledTask[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (assignedTo) params.set('assignedTo', assignedTo);

    return apiClient.get(`/tasks/scheduled/date-range?${params.toString()}`);
  }

  async quickCreateAndSchedule(taskData: QuickCreateTaskRequest): Promise<{
    template: TaskTemplate;
    scheduledTask: ScheduledTask;
  }> {
    return apiClient.post('/tasks/quick-create', taskData);
  }

  async scheduleTaskFromTemplate(templateId: string, scheduleData: {
    scheduledDate: string;
    assignedTo?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
  }): Promise<ScheduledTask> {
    return apiClient.post(`/tasks/templates/${templateId}/schedule`, scheduleData);
  }

  async updateScheduledTask(taskId: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask> {
    return apiClient.put(`/tasks/scheduled/${taskId}`, updates);
  }

  async deleteScheduledTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/scheduled/${taskId}`);
  }

  // Task Completion API
  async completeTask(taskId: string, completionData?: {
    evidence?: {
      type: 'text' | 'image' | 'file';
      content: string;
      files?: File[];
    };
    notes?: string;
  }): Promise<{
    task: ScheduledTask;
    pointsAwarded: number;
    bonusPoints?: {
      source: string;
      amount: number;
    }[];
  }> {
    const formData = new FormData();
    
    if (completionData) {
      formData.append('completionData', JSON.stringify({
        evidence: completionData.evidence ? {
          type: completionData.evidence.type,
          content: completionData.evidence.content,
        } : undefined,
        notes: completionData.notes,
      }));

      if (completionData.evidence?.files) {
        completionData.evidence.files.forEach((file, index) => {
          formData.append(`evidenceFile_${index}`, file);
        });
      }
    }

    return apiClient.upload(`/tasks/scheduled/${taskId}/complete`, formData);
  }

  async uncompleteTask(taskId: string, reason?: string): Promise<ScheduledTask> {
    return apiClient.post(`/tasks/scheduled/${taskId}/uncomplete`, { reason });
  }

  async reviewTaskEvidence(taskId: string, approved: boolean, feedback?: string): Promise<ScheduledTask> {
    return apiClient.post(`/tasks/scheduled/${taskId}/review`, {
      approved,
      feedback,
    });
  }

  // Task Statistics API
  async getTaskStats(userId?: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<{
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalPoints: number;
    categoryBreakdown: {
      [category: string]: {
        completed: number;
        total: number;
        points: number;
      };
    };
    difficultyBreakdown: {
      [difficulty: string]: {
        completed: number;
        total: number;
        points: number;
      };
    };
    trends: {
      date: string;
      completed: number;
      points: number;
    }[];
  }> {
    const params = new URLSearchParams({ timeframe });
    if (userId) params.set('userId', userId);
    
    return apiClient.get(`/tasks/stats?${params.toString()}`);
  }

  async getUserTaskHistory(userId?: string, limit: number = 20, offset: number = 0): Promise<{
    tasks: ScheduledTask[];
    total: number;
    totalPoints: number;
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (userId) params.set('userId', userId);
    
    return apiClient.get(`/tasks/history?${params.toString()}`);
  }

  // Task Recommendations API
  async getRecommendedTasks(limit: number = 10): Promise<{
    tasks: (TaskTemplate & { 
      matchScore: number; 
      reason: string;
      estimatedPoints: number;
    })[];
    categories: {
      category: TaskCategory;
      count: number;
      avgPoints: number;
    }[];
  }> {
    return apiClient.get(`/tasks/recommendations?limit=${limit}`);
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