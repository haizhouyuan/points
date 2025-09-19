import React, { useState, useEffect } from 'react';
import { TaskHistory } from './TaskHistory';
import { taskService } from '../services/task.service';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  completedAt: string;
  category: string;
  streak?: number;
}

interface TaskHistorySectionProps {
  limit?: number;
  showOnlyRecent?: boolean;
}

export function TaskHistorySection({ limit = 20, showOnlyRecent = false }: TaskHistorySectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadTaskHistory();
  }, [limit, showOnlyRecent]);

  const loadTaskHistory = async () => {
    try {
      setLoading(true);
      
      if (authService.isAuthenticated()) {
        try {
          await authService.getCurrentUser();
        } catch (authError) {
          console.warn('无法刷新当前用户信息，继续使用本地数据。', authError);
        }
      }

      // Fetch task history from API
      const response = await taskService.getUserTaskHistory({
        limit: showOnlyRecent ? Math.min(limit, 5) : limit,
        offset: 0,
        status: 'completed'
      });

      // Transform API response to match TaskHistory component interface
      const transformedTasks: Task[] = response.tasks
        .filter(task => task.status === 'completed') // Only show completed tasks
        .map(task => {
          // Calculate streak based on recent task completions
          const streak = calculateTaskStreak(task, response.tasks);
          
          return {
            id: task._id,
            title: task.title,
            description: task.description || task.notes || '完成任务',
            points: task.pointsEarned || task.template?.basePoints || 0,
            completedAt: task.completedAt || task.updatedAt,
            category: getCategoryDisplayName(task.template?.category || 'other'),
            streak: streak >= 3 ? streak : undefined, // Only show streak if >= 3
          };
        });

      setTasks(transformedTasks);
    } catch (error: any) {
      console.error('加载任务历史失败:', error);
      
      // If API call fails, provide fallback mock data to ensure UI functionality
      console.warn('使用备用数据...');
      setTasks([
        {
          id: "fallback-1",
          title: "完成数学作业",
          description: "按时完成今天的数学练习题",
          points: 100,
          completedAt: "2025-01-06T10:30:00Z",
          category: "学习",
          streak: 5
        },
        {
          id: "fallback-2",
          title: "整理房间",
          description: "清理并整理个人房间",
          points: 80,
          completedAt: "2025-01-06T08:15:00Z",
          category: "家务"
        },
        {
          id: "fallback-3",
          title: "阅读30分钟",
          description: "阅读课外读物30分钟",
          points: 60,
          completedAt: "2025-01-05T19:45:00Z",
          category: "阅读",
          streak: 3
        }
      ]);
      
      toast.error('加载任务历史失败，显示示例数据');
    } finally {
      setLoading(false);
    }
  };

  const calculateTaskStreak = (task: any, allTasks: any[]): number => {
    // Simple streak calculation - count consecutive days with same category tasks
    // This is a simplified implementation, in production you'd want more sophisticated logic
    const category = task.template?.category;
    if (!category) return 0;

    const sameCategoryTasks = allTasks
      .filter(t => 
        t.template?.category === category && 
        t.status === 'completed' &&
        new Date(t.completedAt || t.updatedAt) <= new Date(task.completedAt || task.updatedAt)
      )
      .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime());

    // Count consecutive days (simplified)
    let streak = 1;
    for (let i = 1; i < sameCategoryTasks.length; i++) {
      const prevDate = new Date(sameCategoryTasks[i-1].completedAt || sameCategoryTasks[i-1].updatedAt);
      const currDate = new Date(sameCategoryTasks[i].completedAt || sameCategoryTasks[i].updatedAt);
      const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getCategoryDisplayName = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      'exercise': '运动',
      'reading': '阅读',  
      'chores': '家务',
      'learning': '学习',
      'creativity': '创意',
      'other': '其他'
    };
    return categoryMap[category] || '其他';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">加载任务历史中...</span>
      </div>
    );
  }

  return (
    <TaskHistory tasks={tasks} />
  );
}
