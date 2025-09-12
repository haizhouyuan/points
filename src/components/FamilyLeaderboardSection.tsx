import React, { useState, useEffect } from 'react';
import { FamilyLeaderboard } from './FamilyLeaderboard';
import { pointsService } from '../services/points.service';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  points: number;
  avatar?: string;
  isCurrentUser?: boolean;
  weeklyGrowth: number;
}

interface FamilyLeaderboardSectionProps {
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export function FamilyLeaderboardSection({ period = 'weekly' }: FamilyLeaderboardSectionProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFamilyLeaderboard();
  }, [period]);

  const loadFamilyLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Get current user info
      const currentUser = authService.getCurrentUser();
      
      // Fetch family leaderboard from API
      const leaderboardResponse = await pointsService.getFamilyLeaderboard(period);
      
      // Transform API response to match FamilyLeaderboard component interface
      const transformedMembers: FamilyMember[] = leaderboardResponse.rankings.map(ranking => ({
        id: ranking.userId,
        name: ranking.displayName || ranking.username,
        points: ranking.points,
        avatar: ranking.avatar,
        isCurrentUser: currentUser?.id === ranking.userId,
        weeklyGrowth: ranking.change, // change from previous period
      }));

      setMembers(transformedMembers);
    } catch (error: any) {
      console.error('加载家庭排行榜失败:', error);
      
      // If API call fails, provide fallback mock data to ensure UI functionality
      console.warn('使用备用数据...');
      const currentUser = authService.getCurrentUser();
      setMembers([
        {
          id: "fallback-1",
          name: "小明",
          points: 2580,
          isCurrentUser: currentUser?.username === "小明" || !currentUser,
          weeklyGrowth: 350
        },
        {
          id: "fallback-2", 
          name: "小红",
          points: 3200,
          isCurrentUser: currentUser?.username === "小红",
          weeklyGrowth: 180
        },
        {
          id: "fallback-3",
          name: "小强",
          points: 1950,
          isCurrentUser: currentUser?.username === "小强",
          weeklyGrowth: -50
        },
        {
          id: "fallback-4",
          name: "妈妈",
          points: 1200,
          isCurrentUser: currentUser?.username === "妈妈",
          weeklyGrowth: 120
        }
      ]);
      
      toast.error('加载排行榜失败，显示示例数据');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">加载排行榜中...</span>
      </div>
    );
  }

  return (
    <FamilyLeaderboard members={members} />
  );
}