import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Flame, Zap, Shield, Clock, Star, Award } from 'lucide-react';

interface StreakData {
  current: number;
  max: number;
  lastActiveDate: string;
  category: string;
  milestones: number[];
  canRestore: boolean;
  brokenYesterday: boolean;
}

interface StreakSystemProps {
  streaks: StreakData[];
  userPoints: number;
  onRestoreStreak: (category: string, cost: number) => void;
  onClaimMilestone: (category: string, milestone: number) => void;
}

export function StreakSystem({ streaks, userPoints, onRestoreStreak, onClaimMilestone }: StreakSystemProps) {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedStreak, setSelectedStreak] = useState<StreakData | null>(null);

  // 连击恢复费用计算
  const getRestoreCost = (streak: StreakData) => {
    return Math.min(streak.max * 10, 200); // 最大200积分
  };

  // 连击里程碑奖励
  const getMilestoneReward = (milestone: number) => {
    if (milestone === 7) return 200;
    if (milestone === 14) return 500;
    if (milestone === 21) return 1000;
    if (milestone === 50) return 2500;
    if (milestone === 100) return 5000;
    return milestone * 15;
  };

  // 获取连击颜色和样式
  const getStreakColorAndStyle = (current: number) => {
    if (current >= 50) return {
      textColor: 'text-duolingo-purple',
      bgGradient: 'bg-gradient-to-r from-duolingo-purple to-duolingo-pink'
    };
    if (current >= 21) return {
      textColor: 'text-duolingo-blue',
      bgGradient: 'bg-gradient-to-r from-duolingo-blue to-duolingo-blue-light'
    };
    if (current >= 7) return {
      textColor: 'text-duolingo-orange',
      bgGradient: 'bg-gradient-to-r from-duolingo-orange to-duolingo-orange-light'
    };
    return {
      textColor: 'text-duolingo-green',
      bgGradient: 'bg-gradient-to-r from-duolingo-green to-duolingo-green-light'
    };
  };

  // 获取火焰强度
  const getFlameIntensity = (current: number) => {
    if (current >= 50) return '🔥🔥🔥';
    if (current >= 21) return '🔥🔥';
    if (current >= 7) return '🔥';
    return '🟠';
  };

  const handleRestoreStreak = () => {
    if (!selectedStreak) return;
    
    const cost = getRestoreCost(selectedStreak);
    if (userPoints < cost) {
      toast.error('积分不足！继续完成任务获得更多积分吧 💪');
      return;
    }

    onRestoreStreak(selectedStreak.category, cost);
    setShowRestoreDialog(false);
    setSelectedStreak(null);
    
    toast.success(
      `🎉 连击已恢复！`,
      {
        description: `${selectedStreak.category}连击已恢复，继续保持好习惯！`,
        duration: 5000,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* 🔥 连击概览卡片 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Card className="bg-gradient-to-br from-duolingo-orange-subtle via-duolingo-yellow-subtle to-duolingo-orange-subtle border-4 border-duolingo-orange/40 shadow-2xl shadow-duolingo-orange/30 rounded-[2rem] overflow-hidden relative">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-duolingo-yellow/20 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-duolingo-orange/30 rounded-full translate-y-10 -translate-x-10"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-duolingo-pink/20 rounded-full"></div>
          
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="flex items-center gap-4 text-2xl font-black">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-4xl"
              >
                🔥
              </motion.div>
              <span className="bg-gradient-to-r from-duolingo-orange to-duolingo-yellow bg-clip-text text-transparent">
                连击系统
              </span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-6">
            {/* 连击统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                className="bg-white rounded-[1.5rem] p-4 text-center border-2 border-duolingo-green/30 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-black text-duolingo-green">
                  {streaks.reduce((sum, s) => sum + s.current, 0)}
                </div>
                <div className="text-warm-gray-600 font-semibold">总连击</div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-[1.5rem] p-4 text-center border-2 border-duolingo-orange/30 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-black text-duolingo-orange">
                  {Math.max(...streaks.map(s => s.current))}
                </div>
                <div className="text-warm-gray-600 font-semibold">最高连击</div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-[1.5rem] p-4 text-center border-2 border-duolingo-blue/30 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-black text-duolingo-blue">
                  {streaks.filter(s => s.current >= 7).length}
                </div>
                <div className="text-warm-gray-600 font-semibold">周连击</div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-[1.5rem] p-4 text-center border-2 border-duolingo-purple/30 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl font-black text-duolingo-purple">
                  {streaks.filter(s => s.current >= 21).length}
                </div>
                <div className="text-warm-gray-600 font-semibold">月连击</div>
              </motion.div>
            </div>

            {/* 各类别连击详情 */}
            <div className="space-y-4">
              {streaks.map((streak, index) => {
                const colorStyle = getStreakColorAndStyle(streak.current);
                const flames = getFlameIntensity(streak.current);
                const nextMilestone = streak.milestones.find(m => m > streak.current);
                
                return (
                  <motion.div
                    key={streak.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-[1.5rem] p-4 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center justify-between">
                      {/* 左侧：类别和连击 */}
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className="text-4xl"
                          animate={{ scale: streak.current > 0 ? [1, 1.1, 1] : 1 }}
                          transition={{ duration: 1.5, repeat: streak.current > 0 ? Infinity : 0, repeatDelay: 2 }}
                        >
                          {flames}
                        </motion.div>
                        <div>
                          <div className="font-bold text-lg text-warm-gray-800">
                            {streak.category}
                          </div>
                          <div className={`font-black text-2xl ${colorStyle.textColor}`}>
                            {streak.current} 天连击
                          </div>
                          {streak.max > streak.current && (
                            <div className="text-sm text-warm-gray-500">
                              最佳记录: {streak.max} 天
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 右侧：操作按钮 */}
                      <div className="flex items-center gap-3">
                        {/* 下一个里程碑 */}
                        {nextMilestone && (
                          <div className="text-center">
                            <div className="text-xs text-warm-gray-500">距离里程碑</div>
                            <div className="font-bold text-duolingo-green">
                              {nextMilestone - streak.current} 天
                            </div>
                          </div>
                        )}

                        {/* 修复连击按钮 */}
                        {streak.brokenYesterday && streak.canRestore && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStreak(streak);
                              setShowRestoreDialog(true);
                            }}
                            className="bg-duolingo-yellow/20 border-duolingo-yellow hover:bg-duolingo-yellow/40 text-duolingo-orange-dark font-semibold rounded-xl"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            修复连击
                          </Button>
                        )}

                        {/* 里程碑奖励 */}
                        {streak.milestones.includes(streak.current) && (
                          <Button
                            onClick={() => onClaimMilestone(streak.category, streak.current)}
                            className="bg-gradient-to-r from-duolingo-purple to-duolingo-pink text-white font-bold px-4 py-2 rounded-xl hover:scale-105 transition-transform shadow-lg"
                          >
                            <Award className="w-4 h-4 mr-2" />
                            领奖励
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* 进度条到下一个里程碑 */}
                    {nextMilestone && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-warm-gray-500 mb-1">
                          <span>当前: {streak.current}天</span>
                          <span>目标: {nextMilestone}天</span>
                        </div>
                        <div className="w-full bg-warm-gray-200 rounded-full h-2">
                          <motion.div
                            className={`${colorStyle.bgGradient} h-2 rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${(streak.current / nextMilestone) * 100}%` 
                            }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 修复连击对话框 */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-4 border-duolingo-orange/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Shield className="w-6 h-6 text-duolingo-orange" />
              修复连击
            </DialogTitle>
            <DialogDescription className="text-base">
              使用积分修复昨天中断的连击，让你的习惯继续保持！
            </DialogDescription>
          </DialogHeader>
          
          {selectedStreak && (
            <div className="space-y-4">
              <div className="bg-warm-gray-50 rounded-xl p-4">
                <div className="font-semibold text-lg">{selectedStreak.category}</div>
                <div className="text-warm-gray-600">
                  连击从 {selectedStreak.current} 天恢复到 {selectedStreak.current + 1} 天
                </div>
                <div className="mt-2 text-2xl font-bold text-duolingo-orange">
                  费用: {getRestoreCost(selectedStreak)} 积分
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-warm-gray-500">
                  你的积分: {userPoints}
                </div>
                <div className="space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRestoreDialog(false)}
                    className="rounded-xl"
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleRestoreStreak}
                    disabled={userPoints < getRestoreCost(selectedStreak)}
                    className="bg-gradient-to-r from-duolingo-orange to-duolingo-yellow text-white font-bold rounded-xl hover:scale-105 transition-transform"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    修复连击
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}