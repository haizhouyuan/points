import React, { useState, useEffect } from 'react';
import { HabitTracker } from './HabitTracker';
import { pointsService } from '../services/points.service';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface HabitStreak {
  id: string;
  category: string;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate: string;
  icon: string;
  color: string;
}

interface HabitTrackerSectionProps {
  onPointsUpdated?: (points: number) => void;
}

export function HabitTrackerSection({ onPointsUpdated }: HabitTrackerSectionProps) {
  const [habits, setHabits] = useState<HabitStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      
      // Call habit tracking API
      const habitsResponse = await fetch('/api/habits/streaks');
      if (!habitsResponse.ok) {
        throw new Error('Failed to load habits');
      }
      
      const habitsData = await habitsResponse.json();
      setHabits(habitsData.habits || []);
    } catch (error) {
      console.error('加载习惯数据失败:', error);
      
      // Fallback to mock data if API fails
      console.warn('使用备用数据...');
      const mockHabits: HabitStreak[] = [
        {
          id: "exercise",
          category: "运动",
          currentStreak: 5,
          maxStreak: 12,
          lastCompletedDate: "2025-01-06",
          icon: "💪",
          color: "from-orange-400 to-red-500"
        },
        {
          id: "reading", 
          category: "阅读",
          currentStreak: 21,
          maxStreak: 21,
          lastCompletedDate: "2025-01-06",
          icon: "📚",
          color: "from-blue-400 to-indigo-500"
        },
        {
          id: "chores",
          category: "家务",
          currentStreak: 3,
          maxStreak: 8,
          lastCompletedDate: "2025-01-04",
          icon: "🏠",
          color: "from-green-400 to-emerald-500"
        },
        {
          id: "learning",
          category: "学习",
          currentStreak: 0,
          maxStreak: 15,
          lastCompletedDate: "2025-01-02",
          icon: "📖",
          color: "from-purple-400 to-violet-500"
        }
      ];

      setHabits(mockHabits);
      toast.error('加载习惯数据失败，显示示例数据');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (category: string, milestone: number) => {
    try {
      setClaiming(category);
      
      // 计算奖励积分
      const pointsReward = milestone * 30; // 7天=210分，14天=420分，21天=630分
      
      const cachedUser = authService.getCurrentUserSync();
      let userId = cachedUser?._id || (cachedUser as any)?.id;

      if (!userId && authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          userId = currentUser?._id || (currentUser as any)?.id;
        } catch (userError) {
          console.warn('获取当前用户信息失败:', userError);
        }
      }

      if (!userId) {
        toast.error('请登录后再领取习惯奖励');
        return;
      }

      // 调用积分奖励API
      await pointsService.awardPoints({
        userId,
        amount: pointsReward,
        source: {
          type: 'streak_bonus',
          description: `${category}习惯 ${milestone}天里程碑`
        },
        notes: `Habit streak milestone: ${category} - ${milestone} days`
      });

      toast.success(
        `🎉 恭喜达成${category} ${milestone}天里程碑！\n获得 ${pointsReward} 积分奖励！`,
        { duration: 4000 }
      );

      // 通知父组件积分更新
      onPointsUpdated?.(pointsReward);

      // 重新加载习惯数据
      await loadHabits();
      
    } catch (error: any) {
      console.error('领取习惯奖励失败:', error);
      toast.error(error?.message || '领取奖励失败，请重试');
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">加载习惯数据中...</span>
      </div>
    );
  }

  return (
    <HabitTracker 
      habits={habits}
      onClaimReward={handleClaimReward}
      claimingCategory={claiming}
    />
  );
}
