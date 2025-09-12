import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RewardCard } from './RewardCard';
import { pointsService } from '../services/points.service';
import { authService } from '../services/auth.service';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  image?: string;
  category: string;
  available: boolean;
}

interface RewardsSectionProps {
  userPoints: number;
  onRedeemSuccess?: (rewardId: string, cost: number) => void;
}

export function RewardsSection({ userPoints, onRedeemSuccess }: RewardsSectionProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      
      // Call real API to get available rewards
      const rewardsResponse = await fetch('/api/rewards/available');
      if (!rewardsResponse.ok) {
        throw new Error('Failed to load rewards');
      }
      
      const rewardsData = await rewardsResponse.json();
      setRewards(rewardsData.rewards || []);
    } catch (error) {
      console.error('加载奖励列表失败:', error);
      
      // Fallback to mock data if API fails
      console.warn('使用备用数据...');
      setRewards([
        {
          id: "1",
          title: "乐高积木套装",
          description: "经典城市系列，包含警察局和消防站",
          cost: 2500,
          category: "玩具",
          available: true,
          image: "https://images.unsplash.com/photo-1613825787641-2dbbd4f96a1c?w=300"
        },
        {
          id: "2",
          title: "儿童图书套装", 
          description: "包含5本精选儿童文学作品",
          cost: 800,
          category: "图书",
          available: true
        },
        {
          id: "3",
          title: "游乐园门票",
          description: "迪士尼乐园一日游门票",
          cost: 5000,
          category: "户外",
          available: true
        },
        {
          id: "4",
          title: "平板电脑",
          description: "iPad Air 适合学习和娱乐",
          cost: 8000,
          category: "电子",
          available: false
        },
        {
          id: "5",
          title: "美味零食大礼包",
          description: "包含各种健康美味的儿童零食",
          cost: 300,
          category: "零食",
          available: true
        }
      ]);
      
      toast.error('加载奖励列表失败，显示示例数据');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    // 检查积分是否足够
    if (userPoints < reward.cost) {
      toast.error('积分不足！继续完成任务来获得更多积分吧 ✨');
      return;
    }

    // 检查奖励是否可用
    if (!reward.available) {
      toast.error('该奖励暂时缺货中 😅');
      return;
    }

    try {
      setRedeeming(rewardId);
      
      // 调用兑换API
      await pointsService.redeemReward(rewardId, reward.cost);
      
      toast.success(
        `🎉 兑换申请已提交！\n${reward.title} 等待家长审批中...`,
        { duration: 4000 }
      );

      // 通知父组件兑换成功
      onRedeemSuccess?.(rewardId, reward.cost);
      
    } catch (error: any) {
      console.error('兑换失败:', error);
      toast.error(error?.message || '兑换失败，请重试');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-gray-600">加载奖励中...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rewards.map((reward, index) => (
        <motion.div
          key={reward.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <RewardCard
            {...reward}
            userPoints={userPoints}
            onRedeem={handleRedeem}
            disabled={redeeming === reward.id}
          />
        </motion.div>
      ))}
    </div>
  );
}